import { Router } from 'express';
import { param } from 'express-validator';
import { Permission } from '@paperless/shared';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { validate } from '../middleware/validation';
import {
  UserController,
  createAdminValidation,
  createTeacherValidation,
  createStudentValidation,
} from '../controllers/user.controller';

const router = Router();

/**
 * User Management Routes
 * All routes require authentication
 */

// Create Admin User (SUPER_ADMIN only)
router.post(
  '/admin',
  authenticate,
  requirePermission(Permission.CREATE_USER),
  validate(createAdminValidation),
  UserController.createAdmin as any
);

// Create Teacher User (ADMIN only)
router.post(
  '/teacher',
  authenticate,
  requirePermission(Permission.CREATE_USER),
  validate(createTeacherValidation),
  UserController.createTeacher as any
);

// Create Student User (ADMIN only)
router.post(
  '/student',
  authenticate,
  requirePermission(Permission.CREATE_USER),
  validate(createStudentValidation),
  UserController.createStudent as any
);

// Get All Users
router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_USER),
  UserController.getAll as any
);

// Delete User
router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.DELETE_USER),
  validate([param('id').isUUID().withMessage('Valid user ID is required')]),
  UserController.delete as any
);

export default router;
