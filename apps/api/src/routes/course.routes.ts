import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { Permission } from '@paperless/shared';
import {
  CourseController,
  createCourseValidation,
  updateCourseValidation,
} from '../controllers/course.controller';
import { param } from 'express-validator';

const router = Router();

// All course routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/courses
 * @desc    Get all courses for user's university
 * @access  Authenticated users
 */
router.get('/', CourseController.getAll as any);

/**
 * @route   GET /api/v1/courses/:id
 * @desc    Get course by ID
 * @access  Authenticated users
 */
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Valid course ID is required')]),
  CourseController.getById as any
);

/**
 * @route   POST /api/v1/courses
 * @desc    Create new course
 * @access  Users with CREATE_COURSE permission
 */
router.post(
  '/',
  requirePermission(Permission.CREATE_COURSE),
  validate(createCourseValidation),
  CourseController.create as any
);

/**
 * @route   PUT /api/v1/courses/:id
 * @desc    Update course
 * @access  Users with UPDATE_COURSE permission
 */
router.put(
  '/:id',
  requirePermission(Permission.UPDATE_COURSE),
  validate(updateCourseValidation),
  CourseController.update as any
);

/**
 * @route   DELETE /api/v1/courses/:id
 * @desc    Delete course
 * @access  Users with DELETE_COURSE permission
 */
router.delete(
  '/:id',
  requirePermission(Permission.DELETE_COURSE),
  validate([param('id').isUUID().withMessage('Valid course ID is required')]),
  CourseController.delete as any
);

/**
 * @route   PATCH /api/v1/courses/:id/toggle-status
 * @desc    Toggle course active status
 * @access  Users with UPDATE_COURSE permission
 */
router.patch(
  '/:id/toggle-status',
  requirePermission(Permission.UPDATE_COURSE),
  validate([param('id').isUUID().withMessage('Valid course ID is required')]),
  CourseController.toggleStatus as any
);

export default router;
