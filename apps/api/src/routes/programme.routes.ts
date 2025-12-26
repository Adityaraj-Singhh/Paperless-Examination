import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { Permission } from '@paperless/shared';
import {
  ProgrammeController,
  createProgrammeValidation,
  updateProgrammeValidation,
} from '../controllers/programme.controller';
import { param } from 'express-validator';

const router = Router();

// All programme routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/programmes
 * @desc    Get all programmes for user's university
 * @access  Authenticated users
 */
router.get('/', ProgrammeController.getAll as any);

/**
 * @route   GET /api/v1/programmes/:id
 * @desc    Get programme by ID
 * @access  Authenticated users
 */
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Valid programme ID is required')]),
  ProgrammeController.getById as any
);

/**
 * @route   POST /api/v1/programmes
 * @desc    Create new programme
 * @access  Users with CREATE_PROGRAMME permission
 */
router.post(
  '/',
  requirePermission(Permission.CREATE_PROGRAMME),
  validate(createProgrammeValidation),
  ProgrammeController.create as any
);

/**
 * @route   PUT /api/v1/programmes/:id
 * @desc    Update programme
 * @access  Users with UPDATE_PROGRAMME permission
 */
router.put(
  '/:id',
  requirePermission(Permission.UPDATE_PROGRAMME),
  validate(updateProgrammeValidation),
  ProgrammeController.update as any
);

/**
 * @route   DELETE /api/v1/programmes/:id
 * @desc    Delete programme
 * @access  Users with DELETE_PROGRAMME permission
 */
router.delete(
  '/:id',
  requirePermission(Permission.DELETE_PROGRAMME),
  validate([param('id').isUUID().withMessage('Valid programme ID is required')]),
  ProgrammeController.delete as any
);

/**
 * @route   PATCH /api/v1/programmes/:id/toggle-status
 * @desc    Toggle programme active status
 * @access  Users with UPDATE_PROGRAMME permission
 */
router.patch(
  '/:id/toggle-status',
  requirePermission(Permission.UPDATE_PROGRAMME),
  validate([param('id').isUUID().withMessage('Valid programme ID is required')]),
  ProgrammeController.toggleStatus as any
);

export default router;
