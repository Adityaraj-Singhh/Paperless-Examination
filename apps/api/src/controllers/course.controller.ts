import { Response } from 'express';
import { body, param } from 'express-validator';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { AuditService } from '../services/audit.service';
import { logger } from '../config/logger';

/**
 * Validation Rules
 */
export const createCourseValidation = [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('code')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code is required (2-20 characters)'),
  body('programmeId').isUUID().withMessage('Valid programme ID is required'),
  body('credits').isInt({ min: 1 }).withMessage('Credits must be a positive integer'),
  body('semester').optional().isInt({ min: 1 }).withMessage('Semester must be a positive integer'),
];

export const updateCourseValidation = [
  param('id').isUUID().withMessage('Valid course ID is required'),
  body('name').optional().trim().notEmpty().withMessage('Course name cannot be empty'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be 2-20 characters'),
  body('programmeId').optional().isUUID().withMessage('Valid programme ID is required'),
  body('credits').optional().isInt({ min: 1 }).withMessage('Credits must be a positive integer'),
  body('semester').optional().isInt({ min: 1 }).withMessage('Semester must be a positive integer'),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * Course Controller
 * Manages course CRUD operations within programmes
 */
export class CourseController {
  /**
   * Get All Courses for User's University
   * GET /api/v1/courses
   * Query: ?programmeId=uuid (optional)
   */
  static getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { programmeId } = req.query;

    const whereClause: any = {
      programme: {
        department: {
          school: {
            universityId: req.user!.universityId,
          },
        },
      },
    };

    if (programmeId) {
      whereClause.programmeId = programmeId as string;
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      orderBy: [{ semester: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        credits: true,
        semester: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        programme: {
          select: {
            id: true,
            name: true,
            code: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                school: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            examCourses: true,
          },
        },
      },
    });

    sendSuccess(res, courses, 'Courses retrieved successfully');
  });

  /**
   * Get Course by ID
   * GET /api/v1/courses/:id
   */
  static getById = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const course = await prisma.course.findFirst({
      where: {
        id,
        programme: {
          department: {
            school: {
              universityId: req.user!.universityId,
            },
          },
        },
      },
      include: {
        programme: {
          select: {
            id: true,
            name: true,
            code: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                school: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            examCourses: true,
          },
        },
      },
    });

    if (!course) {
      throw new AppError(404, 'Course not found');
    }

    sendSuccess(res, course, 'Course retrieved successfully');
  });

  /**
   * Create Course
   * POST /api/v1/courses
   */
  static create = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { name, code, programmeId, credits, semester } = req.body;

    // Verify programme exists and belongs to user's university
    const programme = await prisma.programme.findFirst({
      where: {
        id: programmeId,
        department: {
          school: {
            universityId: req.user!.universityId,
          },
        },
      },
      select: {
        id: true,
        departmentId: true,
      },
    });

    if (!programme) {
      throw new AppError(404, 'Programme not found in your university');
    }

    const departmentId = programme.departmentId;

    // Check if code already exists in this programme
    const existingCourse = await prisma.course.findUnique({
      where: {
        universityId_departmentId_code: {
          universityId: req.user!.universityId,
          departmentId,
          code,
        },
      },
    });

    if (existingCourse) {
      throw new AppError(409, 'Course with this code already exists in this programme');
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        name,
        code,
        credits,
        semester,
        programmeId,
        departmentId,
        universityId: req.user!.universityId,
      },
      include: {
        programme: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'Course',
      entityId: course.id,
      afterState: { name, code, programmeId, credits, semester },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Course created: ${name} (${code}) by user ${req.user!.userId}`);

    sendSuccess(res, course, 'Course created successfully', 201);
  });

  /**
   * Update Course
   * PUT /api/v1/courses/:id
   */
  static update = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Get existing course
    const existingCourse = await prisma.course.findFirst({
      where: {
        id,
        programme: {
          department: {
            school: {
              universityId: req.user!.universityId,
            },
          },
        },
      },
    });

    if (!existingCourse) {
      throw new AppError(404, 'Course not found');
    }

    // If programmeId is being updated, verify it exists
    if (updateData.programmeId) {
      const programme = await prisma.programme.findFirst({
        where: {
          id: updateData.programmeId,
          department: {
            school: {
              universityId: req.user!.universityId,
            },
          },
        },
      });

      if (!programme) {
        throw new AppError(404, 'Programme not found in your university');
      }
    }

    // If code is being updated, check uniqueness
    const targetDepartmentId = updateData.departmentId || existingCourse.departmentId;
    if (updateData.code && updateData.code !== existingCourse.code) {
      const codeExists = await prisma.course.findUnique({
        where: {
          universityId_departmentId_code: {
            universityId: req.user!.universityId,
            departmentId: targetDepartmentId,
            code: updateData.code,
          },
        },
      });

      if (codeExists) {
        throw new AppError(409, 'Course with this code already exists in this programme');
      }
    }

    // Update course
    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        programme: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'Course',
      entityId: id,
      beforeState: existingCourse,
      afterState: course,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Course updated: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, course, 'Course updated successfully');
  });

  /**
   * Delete Course
   * DELETE /api/v1/courses/:id
   */
  static delete = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get existing course
    const existingCourse = await prisma.course.findFirst({
      where: {
        id,
        programme: {
          department: {
            school: {
              universityId: req.user!.universityId,
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            examCourses: true,
          },
        },
      },
    });

    if (!existingCourse) {
      throw new AppError(404, 'Course not found');
    }

    // Check if course has dependencies
    if (existingCourse._count.examCourses > 0) {
      throw new AppError(
        400,
        'Cannot delete course with existing exams. Consider deactivating instead.'
      );
    }

    // Delete course
    await prisma.course.delete({
      where: { id },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'Course',
      entityId: id,
      beforeState: existingCourse,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Course deleted: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, null, 'Course deleted successfully');
  });

  /**
   * Toggle Course Active Status
   * PATCH /api/v1/courses/:id/toggle-status
   */
  static toggleStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const existingCourse = await prisma.course.findFirst({
      where: {
        id,
        programme: {
          department: {
            school: {
              universityId: req.user!.universityId,
            },
          },
        },
      },
    });

    if (!existingCourse) {
      throw new AppError(404, 'Course not found');
    }

    const course = await prisma.course.update({
      where: { id },
      data: { isActive: !existingCourse.isActive },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'Course',
      entityId: id,
      beforeState: { isActive: existingCourse.isActive },
      afterState: { isActive: course.isActive },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(
      `Course status toggled: ${id} to ${course.isActive} by user ${req.user!.userId}`
    );

    sendSuccess(
      res,
      course,
      `Course ${course.isActive ? 'activated' : 'deactivated'} successfully`
    );
  });
}
