import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@paperless/shared';
import {
  UniversityController,
  createUniversityValidation,
  updateUniversityValidation,
} from '../controllers/university.controller';
import { param } from 'express-validator';

const router = Router();

// All university routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole(UserRole.SUPER_ADMIN));

/**
 * @route   GET /api/v1/universities
 * @desc    Get all universities
 * @access  Super Admin
 */
router.get('/', UniversityController.getAll as any);

/**
 * @route   GET /api/v1/universities/:id
 * @desc    Get university by ID
 * @access  Super Admin
 */
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Valid university ID is required')]),
  UniversityController.getById as any
);

/**
 * @route   POST /api/v1/universities
 * @desc    Create new university
 * @access  Super Admin
 */
router.post(
  '/',
  validate(createUniversityValidation),
  UniversityController.create as any
);

/**
 * @route   PUT /api/v1/universities/:id
 * @desc    Update university
 * @access  Super Admin
 */
router.put(
  '/:id',
  validate(updateUniversityValidation),
  UniversityController.update as any
);

/**
 * @route   DELETE /api/v1/universities/:id
 * @desc    Delete university
 * @access  Super Admin
 */
router.delete(
  '/:id',
  validate([param('id').isUUID().withMessage('Valid university ID is required')]),
  UniversityController.delete as any
);

/**
 * @route   PATCH /api/v1/universities/:id/toggle-status
 * @desc    Toggle university active status
 * @access  Super Admin
 */
router.patch(
  '/:id/toggle-status',
  validate([param('id').isUUID().withMessage('Valid university ID is required')]),
  UniversityController.toggleStatus as any
);

export default router;
