import { Request, Response } from 'express';
import { body } from 'express-validator';
import { UserRole, AuthResponse } from '@paperless/shared';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/auth';
import { sendSuccess } from '../utils/response';
import { AuditService } from '../services/audit.service';
import { logger } from '../config/logger';

/**
 * Validation Rules
 */
export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must be at least 8 characters with uppercase, lowercase, number and special character'
    ),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('universityId').isUUID().withMessage('Valid university ID is required'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Auth Controller
 */
export class AuthController {
  /**
   * Register New User
   * POST /api/v1/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, universityId, phone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    // Verify university exists
    const university = await prisma.university.findUnique({
      where: { id: universityId },
    });

    if (!university || !university.isActive) {
      throw new AppError(404, 'University not found or inactive');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Find or create default STUDENT role for this university
    let studentRole = await prisma.role.findUnique({
      where: {
        universityId_name: {
          universityId,
          name: UserRole.STUDENT,
        },
      },
    });

    if (!studentRole) {
      studentRole = await prisma.role.create({
        data: {
          universityId,
          name: UserRole.STUDENT,
          description: 'Default student role',
          isSystem: true,
        },
      });
    }

    // Create user and assign STUDENT role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        universityId,
        userRoles: {
          create: {
            roleId: studentRole.id,
          },
        },
      },
    });

    // Log audit
    await AuditService.log({
      universityId,
      userId: user.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      afterState: { email, firstName, lastName, role: UserRole.STUDENT },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User registered: ${email} with role ${UserRole.STUDENT}`);

    sendSuccess(
      res,
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: UserRole.STUDENT,
      },
      'User registered successfully with STUDENT role.',
      201
    );
  });

  /**
   * Login User
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user with roles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Extract roles
    const roles = user.userRoles.map((ur: any) => ur.role.name as UserRole);

    if (roles.length === 0) {
      throw new AppError(403, 'No roles assigned. Please contact administrator.');
    }

    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      universityId: user.universityId,
      roles,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log audit
    await AuditService.logLogin({
      universityId: user.universityId,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User logged in: ${email}`);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        universityId: user.universityId,
        roles,
      },
      accessToken,
      refreshToken,
    };

    sendSuccess(res, response, 'Login successful');
  });

  /**
   * Refresh Access Token
   * POST /api/v1/auth/refresh
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'Refresh token is required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Check if token exists in database and not revoked
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new AppError(401, 'Invalid or revoked refresh token');
    }

    // Check if token expired
    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError(401, 'Refresh token expired');
    }

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive');
    }

    // Extract roles
    const roles = user.userRoles.map((ur: any) => ur.role.name as UserRole);

    // Generate new access token
    const payload = {
      userId: user.id,
      email: user.email,
      universityId: user.universityId,
      roles,
    };

    const accessToken = generateAccessToken(payload);

    logger.info(`Access token refreshed for user: ${user.email}`);

    sendSuccess(res, { accessToken }, 'Token refreshed successfully');
  });

  /**
   * Logout User
   * POST /api/v1/auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { refreshToken } = req.body;

    // Revoke refresh token
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          token: refreshToken,
          userId: authReq.user.userId,
        },
        data: {
          isRevoked: true,
        },
      });
    }

    // Note: Token blacklisting would require Redis/cache
    // For now, tokens are valid until expiry
    // In production, implement token blacklisting or use short-lived tokens

    // Log audit
    await AuditService.logLogout({
      universityId: authReq.user.universityId,
      userId: authReq.user.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User logged out: ${authReq.user.email}`);

    sendSuccess(res, null, 'Logout successful');
  });

  /**
   * Get Current User Profile
   * GET /api/v1/auth/me
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        universityId: true,
        emailVerified: true,
        twoFactorEnabled: true,
        lastLogin: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const roles = user.userRoles.map((ur: any) => ur.role.name);

    sendSuccess(res, { ...user, roles });
  });

  /**
   * Update Profile
   * PATCH /api/v1/auth/profile
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: authReq.user.userId },
      data: {
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
      },
    });

    // Log audit
    await AuditService.log({
      universityId: authReq.user.universityId,
      userId: authReq.user.userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      afterState: { firstName, lastName, phone },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    sendSuccess(res, user, 'Profile updated successfully');
  });

  /**
   * Change Password
   * POST /api/v1/auth/change-password
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    // Log audit
    await AuditService.log({
      universityId: user.universityId,
      userId: user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      afterState: { passwordChanged: true },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Password changed for user: ${user.email}`);

    sendSuccess(res, null, 'Password changed successfully. Please login again.');
  });
}
