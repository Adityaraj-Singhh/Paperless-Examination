import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { Permission } from '@paperless/shared';
import {
  SchoolController,
  createSchoolValidation,
  updateSchoolValidation,
} from '../controllers/school.controller';
import { param } from 'express-validator';

const router = Router();

// All school routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/schools
 * @desc    Get all schools for user's university
 * @access  Authenticated users
 */
router.get('/', SchoolController.getAll as any);

/**
 * @route   GET /api/v1/schools/:id
 * @desc    Get school by ID
 * @access  Authenticated users
 */
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Valid school ID is required')]),
  SchoolController.getById as any
);

/**
 * @route   POST /api/v1/schools
 * @desc    Create new school
 * @access  Users with CREATE_SCHOOL permission
 */
router.post(
  '/',
  requirePermission(Permission.CREATE_SCHOOL),
  validate(createSchoolValidation),
  SchoolController.create as any
);

/**
 * @route   PUT /api/v1/schools/:id
 * @desc    Update school
 * @access  Users with UPDATE_SCHOOL permission
 */
router.put(
  '/:id',
  requirePermission(Permission.UPDATE_SCHOOL),
  validate(updateSchoolValidation),
  SchoolController.update as any
);

/**
 * @route   DELETE /api/v1/schools/:id
 * @desc    Delete school
 * @access  Users with DELETE_SCHOOL permission
 */
router.delete(
  '/:id',
  requirePermission(Permission.DELETE_SCHOOL),
  validate([param('id').isUUID().withMessage('Valid school ID is required')]),
  SchoolController.delete as any
);

/**
 * @route   PATCH /api/v1/schools/:id/toggle-status
 * @desc    Toggle school active status
 * @access  Users with UPDATE_SCHOOL permission
 */
router.patch(
  '/:id/toggle-status',
  requirePermission(Permission.UPDATE_SCHOOL),
  validate([param('id').isUUID().withMessage('Valid school ID is required')]),
  SchoolController.toggleStatus as any
);

export default router;
