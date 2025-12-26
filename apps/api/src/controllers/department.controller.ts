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
export const createDepartmentValidation = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 20 })
    .withMessage('Department code is required (2-20 characters)'),
  body('schoolId').isUUID().withMessage('Valid school ID is required'),
];

export const updateDepartmentValidation = [
  param('id').isUUID().withMessage('Valid department ID is required'),
  body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Department code must be 2-20 characters'),
  body('schoolId').optional().isUUID().withMessage('Valid school ID is required'),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * Department Controller
 * Manages department CRUD operations within schools
 */
export class DepartmentController {
  /**
   * Get All Departments for User's University
   * GET /api/v1/departments
   * Query: ?schoolId=uuid (optional)
   */
  static getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { schoolId } = req.query;

    const whereClause: any = {
      school: {
        universityId: req.user!.universityId,
      },
    };

    if (schoolId) {
      whereClause.schoolId = schoolId as string;
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            programmes: true,
          },
        },
      },
    });

    sendSuccess(res, departments, 'Departments retrieved successfully');
  });

  /**
   * Get Department by ID
   * GET /api/v1/departments/:id
   */
  static getById = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const department = await prisma.department.findFirst({
      where: {
        id,
        school: {
          universityId: req.user!.universityId,
        },
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            universityId: true,
          },
        },
        _count: {
          select: {
            programmes: true,
          },
        },
      },
    });

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    sendSuccess(res, department, 'Department retrieved successfully');
  });

  /**
   * Create Department
   * POST /api/v1/departments
   */
  static create = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { name, code, schoolId } = req.body;

    // Verify school exists and belongs to user's university
    const school = await prisma.school.findFirst({
      where: {
        id: schoolId,
        universityId: req.user!.universityId,
      },
    });

    if (!school) {
      throw new AppError(404, 'School not found in your university');
    }

    // Check if code already exists in this school
    const existingDepartment = await prisma.department.findUnique({
      where: {
        universityId_schoolId_code: {
          universityId: req.user!.universityId,
          schoolId,
          code,
        },
      },
    });

    if (existingDepartment) {
      throw new AppError(409, 'Department with this code already exists in this school');
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name,
        code,
        schoolId,
        universityId: req.user!.universityId,
      },
      include: {
        school: {
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
      entityType: 'Department',
      entityId: department.id,
      afterState: { name, code, schoolId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Department created: ${name} (${code}) by user ${req.user!.userId}`);

    sendSuccess(res, department, 'Department created successfully', 201);
  });

  /**
   * Update Department
   * PUT /api/v1/departments/:id
   */
  static update = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Get existing department
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        school: {
          universityId: req.user!.universityId,
        },
      },
    });

    if (!existingDepartment) {
      throw new AppError(404, 'Department not found');
    }

    // If schoolId is being updated, verify it exists
    if (updateData.schoolId) {
      const school = await prisma.school.findFirst({
        where: {
          id: updateData.schoolId,
          universityId: req.user!.universityId,
        },
      });

      if (!school) {
        throw new AppError(404, 'School not found in your university');
      }
    }

    // If code is being updated, check uniqueness
    const targetSchoolId = updateData.schoolId || existingDepartment.schoolId;
    if (updateData.code && updateData.code !== existingDepartment.code) {
      const codeExists = await prisma.department.findUnique({
        where: {
          universityId_schoolId_code: {
            universityId: req.user!.universityId,
            schoolId: targetSchoolId,
            code: updateData.code,
          },
        },
      });

      if (codeExists) {
        throw new AppError(409, 'Department with this code already exists in this school');
      }
    }

    // Update department
    const department = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        school: {
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
      entityType: 'Department',
      entityId: id,
      beforeState: existingDepartment,
      afterState: department,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Department updated: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, department, 'Department updated successfully');
  });

  /**
   * Delete Department
   * DELETE /api/v1/departments/:id
   */
  static delete = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get existing department
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        school: {
          universityId: req.user!.universityId,
        },
      },
      include: {
        _count: {
          select: {
            programmes: true,
          },
        },
      },
    });

    if (!existingDepartment) {
      throw new AppError(404, 'Department not found');
    }

    // Check if department has dependencies
    if (existingDepartment._count.programmes > 0) {
      throw new AppError(
        400,
        'Cannot delete department with existing programmes. Consider deactivating instead.'
      );
    }

    // Delete department
    await prisma.department.delete({
      where: { id },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'Department',
      entityId: id,
      beforeState: existingDepartment,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Department deleted: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, null, 'Department deleted successfully');
  });

  /**
   * Toggle Department Active Status
   * PATCH /api/v1/departments/:id/toggle-status
   */
  static toggleStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        school: {
          universityId: req.user!.universityId,
        },
      },
    });

    if (!existingDepartment) {
      throw new AppError(404, 'Department not found');
    }

    const department = await prisma.department.update({
      where: { id },
      data: { isActive: !existingDepartment.isActive },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'Department',
      entityId: id,
      beforeState: { isActive: existingDepartment.isActive },
      afterState: { isActive: department.isActive },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(
      `Department status toggled: ${id} to ${department.isActive} by user ${req.user!.userId}`
    );

    sendSuccess(
      res,
      department,
      `Department ${department.isActive ? 'activated' : 'deactivated'} successfully`
    );
  });
}
