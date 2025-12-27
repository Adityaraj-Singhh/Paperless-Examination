import { Response } from 'express';
import { body, param } from 'express-validator';
import { UserRole } from '@paperless/shared';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { AuditService } from '../services/audit.service';
import { logger } from '../config/logger';

/**
 * Validation Rules
 */
export const createUniversityValidation = [
  body('name').trim().notEmpty().withMessage('University name is required'),
  body('code')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 20 })
    .withMessage('University code is required (2-20 characters)'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('website').optional().isURL().withMessage('Valid website URL required'),
  body('logo').optional().isURL().withMessage('Valid logo URL required'),
];

export const updateUniversityValidation = [
  param('id').isUUID().withMessage('Valid university ID is required'),
  body('name').optional().trim().notEmpty().withMessage('University name cannot be empty'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('University code must be 2-20 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('website').optional().isURL().withMessage('Valid website URL required'),
  body('logo').optional().isURL().withMessage('Valid logo URL required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * University Controller
 * Manages university CRUD operations
 * Access: SUPER_ADMIN only
 */
export class UniversityController {
  /**
   * Get All Universities
   * GET /api/v1/universities
   */
  static getAll = asyncHandler<AuthRequest>(async (_req: AuthRequest, res: Response) => {
    const universities = await prisma.university.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        website: true,
        logo: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            schools: true,
          },
        },
      },
    });

    sendSuccess(res, universities, 'Universities retrieved successfully');
  });

  /**
   * Get University by ID
   * GET /api/v1/universities/:id
   */
  static getById = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    // Allow SUPER_ADMIN or users belonging to this university
    const isSuperAdmin = user.roles.includes(UserRole.SUPER_ADMIN);
    const isOwnUniversity = user.universityId === id;

    if (!isSuperAdmin && !isOwnUniversity) {
      throw new AppError(403, 'Access denied');
    }

    const university = await prisma.university.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            schools: true,
            exams: true,
          },
        },
      },
    });

    if (!university) {
      throw new AppError(404, 'University not found');
    }

    sendSuccess(res, university, 'University retrieved successfully');
  });

  /**
   * Create University
   * POST /api/v1/universities
   */
  static create = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const {
      name,
      code,
      email,
      phone,
      address,
      city,
      state,
      country,
      website,
      logo,
    } = req.body;

    // Check if code already exists
    const existingUniversity = await prisma.university.findUnique({
      where: { code },
    });

    if (existingUniversity) {
      throw new AppError(409, 'University with this code already exists');
    }

    // Create university
    const university = await prisma.university.create({
      data: {
        name,
        code,
        email,
        phone,
        address,
        city,
        state,
        country: country || 'India',
        website,
        logo,
      },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'CREATE',
      entityType: 'University',
      entityId: university.id,
      afterState: { name, code, email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`University created: ${name} (${code}) by user ${req.user!.userId}`);

    sendSuccess(res, university, 'University created successfully', 201);
  });

  /**
   * Update University
   * PUT /api/v1/universities/:id
   */
  static update = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Get existing university
    const existingUniversity = await prisma.university.findUnique({
      where: { id },
    });

    if (!existingUniversity) {
      throw new AppError(404, 'University not found');
    }

    // If code is being updated, check uniqueness
    if (updateData.code && updateData.code !== existingUniversity.code) {
      const codeExists = await prisma.university.findUnique({
        where: { code: updateData.code },
      });

      if (codeExists) {
        throw new AppError(409, 'University with this code already exists');
      }
    }

    // Update university
    const university = await prisma.university.update({
      where: { id },
      data: updateData,
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'University',
      entityId: id,
      beforeState: existingUniversity,
      afterState: university,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`University updated: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, university, 'University updated successfully');
  });

  /**
   * Delete University
   * DELETE /api/v1/universities/:id
   */
  static delete = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get existing university
    const existingUniversity = await prisma.university.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            schools: true,
            exams: true,
          },
        },
      },
    });

    if (!existingUniversity) {
      throw new AppError(404, 'University not found');
    }

    // Check if university has dependencies
    if (
      existingUniversity._count.users > 0 ||
      existingUniversity._count.schools > 0 ||
      existingUniversity._count.exams > 0
    ) {
      throw new AppError(
        400,
        'Cannot delete university with existing users, schools, or exams. Consider deactivating instead.'
      );
    }

    // Delete university
    await prisma.university.delete({
      where: { id },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'DELETE',
      entityType: 'University',
      entityId: id,
      beforeState: existingUniversity,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`University deleted: ${id} by user ${req.user!.userId}`);

    sendSuccess(res, null, 'University deleted successfully');
  });

  /**
   * Toggle University Active Status
   * PATCH /api/v1/universities/:id/toggle-status
   */
  static toggleStatus = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const existingUniversity = await prisma.university.findUnique({
      where: { id },
    });

    if (!existingUniversity) {
      throw new AppError(404, 'University not found');
    }

    const university = await prisma.university.update({
      where: { id },
      data: { isActive: !existingUniversity.isActive },
    });

    // Log audit
    await AuditService.log({
      universityId: req.user!.universityId,
      userId: req.user!.userId,
      action: 'UPDATE',
      entityType: 'University',
      entityId: id,
      beforeState: { isActive: existingUniversity.isActive },
      afterState: { isActive: university.isActive },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(
      `University status toggled: ${id} to ${university.isActive} by user ${req.user!.userId}`
    );

    sendSuccess(
      res,
      university,
      `University ${university.isActive ? 'activated' : 'deactivated'} successfully`
    );
  });
}
