import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { Permission } from '@paperless/shared';
import {
  DepartmentController,
  createDepartmentValidation,
  updateDepartmentValidation,
} from '../controllers/department.controller';
import { param } from 'express-validator';

const router = Router();

// All department routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/departments
 * @desc    Get all departments for user's university
 * @access  Authenticated users
 */
router.get('/', DepartmentController.getAll as any);

/**
 * @route   GET /api/v1/departments/:id
 * @desc    Get department by ID
 * @access  Authenticated users
 */
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Valid department ID is required')]),
  DepartmentController.getById as any
);

/**
 * @route   POST /api/v1/departments
 * @desc    Create new department
 * @access  Users with CREATE_DEPARTMENT permission
 */
router.post(
  '/',
  requirePermission(Permission.CREATE_DEPARTMENT),
  validate(createDepartmentValidation),
  DepartmentController.create as any
);

/**
 * @route   PUT /api/v1/departments/:id
 * @desc    Update department
 * @access  Users with UPDATE_DEPARTMENT permission
 */
router.put(
  '/:id',
  requirePermission(Permission.UPDATE_DEPARTMENT),
  validate(updateDepartmentValidation),
  DepartmentController.update as any
);

/**
 * @route   DELETE /api/v1/departments/:id
 * @desc    Delete department
 * @access  Users with DELETE_DEPARTMENT permission
 */
router.delete(
  '/:id',
  requirePermission(Permission.DELETE_DEPARTMENT),
  validate([param('id').isUUID().withMessage('Valid department ID is required')]),
  DepartmentController.delete as any
);

/**
 * @route   PATCH /api/v1/departments/:id/toggle-status
 * @desc    Toggle department active status
 * @access  Users with UPDATE_DEPARTMENT permission
 */
router.patch(
  '/:id/toggle-status',
  requirePermission(Permission.UPDATE_DEPARTMENT),
  validate([param('id').isUUID().withMessage('Valid department ID is required')]),
  DepartmentController.toggleStatus as any
);

export default router;
