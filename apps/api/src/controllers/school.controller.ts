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
export const createSchoolValidation = [
  body('name').trim().notEmpty().withMessage('School name is required'),
  body('code')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 20 })
    .withMessage('School code is required (2-20 characters)'),
];

export const updateSchoolValidation = [
  param('id').isUUID().withMessage('Valid school ID is required'),
  body('name').optional().trim().notEmpty().withMessage('School name cannot be empty'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('School code must be 2-20 characters'),
];

/**
 * School Controller
 * Manages school CRUD operations within a university
 */
export class SchoolController {
  /**
   * Get All Schools for User's University
   * GET /api/v1/schools
   */
  static getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const schools = await prisma.school.findMany({
      where: { universityId: req.user!.universityId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            departments: true,
          },
        },
      },
    });

    sendSuccess(res, schools, 'Schools retrieved successfully');
  });

  /**
   * Get School by ID
   * GET /api/v1/schools/:id
   */
  static getById = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const school = await prisma.school.findFirst({
      where: {
        id,
        universityId: req.user!.universityId,
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            departments: true,
          },
        },
      },
    });

    if (!school) {
      throw new AppError(404, 'School not found');
    }

    sendSuccess(res, school, 'School retrieved successfully');
  });

  /**
   * Create School
   * POST /api/v1/schools
   */
  static create = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { name, code } = req.body;

    // Check if code already exists in this university
    const existingSchool = await prisma.school.findUnique({
      where: {
        universityId_code: {
          universityId: req.user!.universityId,
          code,
        },
      },
    });

    if (existingSchool) {
      throw new AppError(409, 'School with this code already exists in your university');
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        name,
        code,
        universityId: req.user!.universityId,
      },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'School',
      entityId: school.id,
      afterState: { name, code },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`School created: ${name} (${code}) by user ${req.user!.userId}`);

    sendSuccess(res, school, 'School created successfully', 201);
  });

  /**
   * Update School
   * PUT /api/v1/schools/:id
   */
  static update = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Get existing school
    const existingSchool = await prisma.school.findFirst({
      where: {
        id,
        universityId: req.user!.universityId,
      },
    });

    if (!existingSchool) {
      throw new AppError(404, 'School not found');
    }

    // If code is being updated, check uniqueness
    if (updateData.code && updateData.code !== existingSchool.code) {
      const codeExists = await prisma.school.findUnique({
        where: {
          universityId_code: {
            universityId: req.user!.universityId,
            code: updateData.code,
          },
        },
      });

      if (codeExists) {
        throw new AppError(409, 'School with this code already exists in your university');
      }
    }

    // Update school
    const school = await prisma.school.update({
      where: { id },
      data: updateData,
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'School',
      entityId: id,
      beforeState: existingSchool,
      afterState: school,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`School updated: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, school, 'School updated successfully');
  });

  /**
   * Delete School
   * DELETE /api/v1/schools/:id
   */
  static delete = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get existing school
    const existingSchool = await prisma.school.findFirst({
      where: {
        id,
        universityId: req.user!.universityId,
      },
      include: {
        _count: {
          select: {
            departments: true,
          },
        },
      },
    });

    if (!existingSchool) {
      throw new AppError(404, 'School not found');
    }

    // Check if school has dependencies
    if (existingSchool._count.departments > 0) {
      throw new AppError(
        400,
        'Cannot delete school with existing departments. Consider deactivating instead.'
      );
    }

    // Delete school
    await prisma.school.delete({
      where: { id },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'School',
      entityId: id,
      beforeState: existingSchool,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`School deleted: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, null, 'School deleted successfully');
  });

  /**
   * Toggle School Active Status
   * PATCH /api/v1/schools/:id/toggle-status
   */
  static toggleStatus = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const existingSchool = await prisma.school.findFirst({
      where: {
        id,
        universityId: req.user!.universityId,
      },
    });

    if (!existingSchool) {
      throw new AppError(404, 'School not found');
    }

    const school = await prisma.school.update({
      where: { id },
      data: { isActive: !existingSchool.isActive },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'School',
      entityId: id,
      beforeState: { isActive: existingSchool.isActive },
      afterState: { isActive: school.isActive },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(
      `School status toggled: ${id} to ${school.isActive} by user ${req.user!.userId}`
    );

    sendSuccess(
      res,
      school,
      `School ${school.isActive ? 'activated' : 'deactivated'} successfully`
    );
  });
}
