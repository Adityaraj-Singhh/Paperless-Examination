import { Router } from 'express';
import { AuthController, registerValidation, loginValidation } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { rateLimiter, strictRateLimiter } from '../middleware/rateLimiter';
import { body } from 'express-validator';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  rateLimiter('auth'),
  validate(registerValidation),
  AuthController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  rateLimiter('auth'),
  validate(loginValidation),
  AuthController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  rateLimiter('auth'),
  validate([body('refreshToken').notEmpty().withMessage('Refresh token is required')]),
  AuthController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getProfile);

/**
 * @route   PATCH /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch(
  '/profile',
  authenticate,
  validate([
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().trim(),
  ]),
  AuthController.updateProfile
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  strictRateLimiter(),
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        'Password must be at least 8 characters with uppercase, lowercase, number and special character'
      ),
  ]),
  AuthController.changePassword
);

export default router;
