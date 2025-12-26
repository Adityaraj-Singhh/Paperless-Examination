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
export const createProgrammeValidation = [
  body('name').trim().notEmpty().withMessage('Programme name is required'),
  body('code')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 20 })
    .withMessage('Programme code is required (2-20 characters)'),
  body('departmentId').isUUID().withMessage('Valid department ID is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('degree').trim().notEmpty().withMessage('Degree is required'),
];

export const updateProgrammeValidation = [
  param('id').isUUID().withMessage('Valid programme ID is required'),
  body('name').optional().trim().notEmpty().withMessage('Programme name cannot be empty'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Programme code must be 2-20 characters'),
  body('departmentId').optional().isUUID().withMessage('Valid department ID is required'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('degree').optional().trim().notEmpty().withMessage('Degree cannot be empty'),
];

/**
 * Programme Controller
 * Manages programme CRUD operations within departments
 */
export class ProgrammeController {
  /**
   * Get All Programmes for User's University
   * GET /api/v1/programmes
   * Query: ?departmentId=uuid (optional)
   */
  static getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { departmentId } = req.query;

    const whereClause: any = {
      department: {
        school: {
          universityId: req.user!.universityId,
        },
      },
    };

    if (departmentId) {
      whereClause.departmentId = departmentId as string;
    }

    const programmes = await prisma.programme.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        duration: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    sendSuccess(res, programmes, 'Programmes retrieved successfully');
  });

  /**
   * Get Programme by ID
   * GET /api/v1/programmes/:id
   */
  static getById = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const programme = await prisma.programme.findFirst({
      where: {
        id,
        department: {
          school: {
            universityId: req.user!.universityId,
          },
        },
      },
      include: {
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
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (!programme) {
      throw new AppError(404, 'Programme not found');
    }

    sendSuccess(res, programme, 'Programme retrieved successfully');
  });

  /**
   * Create Programme
   * POST /api/v1/programmes
   */
  static create = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { name, code, departmentId, duration, degree } = req.body;

    // Verify department exists and belongs to user's university
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        school: {
          universityId: req.user!.universityId,
        },
      },
    });

    if (!department) {
      throw new AppError(404, 'Department not found in your university');
    }

    // Check if code already exists in this department
    const existingProgramme = await prisma.programme.findUnique({
      where: {
        universityId_departmentId_code: {
          universityId: req.user!.universityId,
          departmentId,
          code,
        },
      },
    });

    if (existingProgramme) {
      throw new AppError(409, 'Programme with this code already exists in this department');
    }

    // Create programme
    const programme = await prisma.programme.create({
      data: {
        name,
        code,
        duration,
        degree,
        departmentId,
        universityId: req.user!.universityId,
      },
      include: {
        department: {
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
      entityType: 'Programme',
      entityId: programme.id,
      afterState: { name, code, departmentId, duration },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Programme created: ${name} (${code}) by user ${req.user!.userId}`);

    sendSuccess(res, programme, 'Programme created successfully', 201);
  });

  /**
   * Update Programme
   * PUT /api/v1/programmes/:id
   */
  static update = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Get existing programme
    const existingProgramme = await prisma.programme.findFirst({
      where: {
        id,
        department: {
          school: {
            universityId: req.user!.universityId,
          },
        },
      },
    });

    if (!existingProgramme) {
      throw new AppError(404, 'Programme not found');
    }

    // If departmentId is being updated, verify it exists
    if (updateData.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: updateData.departmentId,
          school: {
            universityId: req.user!.universityId,
          },
        },
      });

      if (!department) {
        throw new AppError(404, 'Department not found in your university');
      }
    }

    // If code is being updated, check uniqueness
    const targetDepartmentId = updateData.departmentId || existingProgramme.departmentId;
    if (updateData.code && updateData.code !== existingProgramme.code) {
      const codeExists = await prisma.programme.findUnique({
        where: {
          universityId_departmentId_code: {
            universityId: req.user!.universityId,
            departmentId: targetDepartmentId,
            code: updateData.code,
          },
        },
      });

      if (codeExists) {
        throw new AppError(409, 'Programme with this code already exists in this department');
      }
    }

    // Update programme
    const programme = await prisma.programme.update({
      where: { id },
      data: updateData,
      include: {
        department: {
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
      entityType: 'Programme',
      entityId: id,
      beforeState: existingProgramme,
      afterState: programme,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Programme updated: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, programme, 'Programme updated successfully');
  });

  /**
   * Delete Programme
   * DELETE /api/v1/programmes/:id
   */
  static delete = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get existing programme
    const existingProgramme = await prisma.programme.findFirst({
      where: {
        id,
        department: {
          school: {
            universityId: req.user!.universityId,
          },
        },
      },
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (!existingProgramme) {
      throw new AppError(404, 'Programme not found');
    }

    // Check if programme has dependencies
    if (existingProgramme._count.courses > 0) {
      throw new AppError(
        400,
        'Cannot delete programme with existing courses. Consider deactivating instead.'
      );
    }

    // Delete programme
    await prisma.programme.delete({
      where: { id },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'Programme',
      entityId: id,
      beforeState: existingProgramme,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Programme deleted: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, null, 'Programme deleted successfully');
  });

  /**
   * Toggle Programme Active Status
   * PATCH /api/v1/programmes/:id/toggle-status
   */
  static toggleStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const existingProgramme = await prisma.programme.findFirst({
      where: {
        id,
        department: {
          school: {
            universityId: req.user!.universityId,
          },
        },
      },
    });

    if (!existingProgramme) {
      throw new AppError(404, 'Programme not found');
    }

    const programme = await prisma.programme.update({
      where: { id },
      data: { isActive: !existingProgramme.isActive },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'Programme',
      entityId: id,
      beforeState: { isActive: existingProgramme.isActive },
      afterState: { isActive: programme.isActive },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(
      `Programme status toggled: ${id} to ${programme.isActive} by user ${req.user!.userId}`
    );

    sendSuccess(
      res,
      programme,
      `Programme ${programme.isActive ? 'activated' : 'deactivated'} successfully`
    );
  });
}
