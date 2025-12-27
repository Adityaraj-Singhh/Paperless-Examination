import { Request, Response } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@paperless/shared';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/auth';
import { sendSuccess } from '../utils/response';
import { AuditService } from '../services/audit.service';
import { logger } from '../config/logger';

/**
 * Validation Rules
 */
export const createAdminValidation = [
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
  body('phone').optional().trim(),
];

export const createTeacherValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must be at least 8 characters with uppercase, lowercase, number and special character'
    ),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().trim(),
];

export const createStudentValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must be at least 8 characters with uppercase, lowercase, number and special character'
    ),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('studentId').trim().notEmpty().withMessage('Student ID is required'),
  body('phone').optional().trim(),
];

/**
 * User Management Controller
 * Handles creation of admins, teachers, and students
 */
export class UserController {
  /**
   * Create Admin User (SUPER_ADMIN only)
   * POST /api/v1/users/admin
   */
  static createAdmin = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
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

    // Find or create ADMIN role for this university
    let adminRole = await prisma.role.findUnique({
      where: {
        universityId_name: {
          universityId,
          name: UserRole.ADMIN,
        },
      },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          universityId,
          name: UserRole.ADMIN,
          description: 'University Administrator',
          isSystem: true,
        },
      });

      // Grant permissions to ADMIN role
      const adminPermissions = [
        'CREATE_SCHOOL', 'VIEW_SCHOOL', 'UPDATE_SCHOOL', 'DELETE_SCHOOL',
        'CREATE_DEPARTMENT', 'VIEW_DEPARTMENT', 'UPDATE_DEPARTMENT', 'DELETE_DEPARTMENT',
        'CREATE_PROGRAMME', 'VIEW_PROGRAMME', 'UPDATE_PROGRAMME', 'DELETE_PROGRAMME',
        'CREATE_COURSE', 'VIEW_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE',
        'CREATE_EXAM', 'VIEW_EXAM', 'UPDATE_EXAM', 'DELETE_EXAM', 'APPROVE_EXAM', 'PUBLISH_EXAM',
        'CREATE_USER', 'VIEW_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE',
        'VIEW_QUESTION', 'MODERATE_QUESTION', 'SEAL_QUESTION_BANK',
        'APPROVE_PAPER', 'VIEW_PAPER',
        'VIEW_EXAM_SESSION', 'ASSIGN_EVALUATOR', 'APPROVE_EVALUATION', 'VIEW_EVALUATION',
        'PUBLISH_RESULTS', 'VIEW_RESULTS', 'APPROVE_SCRUTINY',
        'VIEW_AUDIT_LOGS', 'GENERATE_REPORTS', 'VIEW_ANALYTICS',
      ];

      for (const permName of adminPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permName },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }

    // Create admin user
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
            roleId: adminRole.id,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        university: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Log audit
    await AuditService.log({
      universityId,
      userId: authReq.user!.userId,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      afterState: { email, role: UserRole.ADMIN },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Admin user created: ${email} for university: ${university.name}`);

    const { password: _, ...userWithoutPassword } = user;
    sendSuccess(res, userWithoutPassword, 'Admin user created successfully', 201);
  });

  /**
   * Create Teacher User (ADMIN only)
   * POST /api/v1/users/teacher
   */
  static createTeacher = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { email, password, firstName, lastName, phone } = req.body;
    const universityId = authReq.user!.universityId;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Find or create TEACHER role
    let teacherRole = await prisma.role.findUnique({
      where: {
        universityId_name: {
          universityId,
          name: UserRole.TEACHER,
        },
      },
    });

    if (!teacherRole) {
      teacherRole = await prisma.role.create({
        data: {
          universityId,
          name: UserRole.TEACHER,
          description: 'Teacher',
          isSystem: true,
        },
      });

      // Grant permissions to TEACHER role
      const teacherPermissions = [
        'VIEW_SCHOOL', 'VIEW_DEPARTMENT', 'VIEW_PROGRAMME', 'VIEW_COURSE',
        'VIEW_EXAM', 'CREATE_QUESTION', 'UPDATE_QUESTION', 'DELETE_QUESTION', 'VIEW_QUESTION',
        'GENERATE_PAPER', 'VIEW_PAPER', 'CONDUCT_EXAM', 'VIEW_EXAM_SESSION',
        'EVALUATE_ANSWER', 'VIEW_EVALUATION', 'VIEW_RESULTS', 'APPROVE_SCRUTINY',
        'GENERATE_REPORTS', 'VIEW_ANALYTICS',
      ];

      for (const permName of teacherPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permName },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: teacherRole.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }

    // Create teacher user
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
            roleId: teacherRole.id,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Log audit
    await AuditService.log({
      universityId,
      userId: authReq.user!.userId,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      afterState: { email, role: UserRole.TEACHER },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Teacher user created: ${email}`);

    const { password: _, ...userWithoutPassword } = user;
    sendSuccess(res, userWithoutPassword, 'Teacher user created successfully', 201);
  });

  /**
   * Create Student User (ADMIN only)
   * POST /api/v1/users/student
   */
  static createStudent = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { email, password, firstName, lastName, phone } = req.body;
    const universityId = authReq.user!.universityId;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Find or create STUDENT role
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
          description: 'Student',
          isSystem: true,
        },
      });

      // Grant permissions to STUDENT role
      const studentPermissions = [
        'VIEW_COURSE', 'SUBMIT_EXAM', 'VIEW_RESULTS', 'REQUEST_SCRUTINY',
      ];

      for (const permName of studentPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permName },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: studentRole.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }

    // Create student user
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
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Log audit
    await AuditService.log({
      universityId,
      userId: authReq.user!.userId,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      afterState: { email, role: UserRole.STUDENT },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Student user created: ${email}`);

    const { password: _, ...userWithoutPassword } = user;
    sendSuccess(res, userWithoutPassword, 'Student user created successfully', 201);
  });

  /**
   * Get All Users (filtered by university for ADMIN, all for SUPER_ADMIN)
   * GET /api/v1/users
   */
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const isSuperAdmin = authReq.user!.roles.includes(UserRole.SUPER_ADMIN);
    const whereClause = isSuperAdmin ? {} : { universityId: authReq.user!.universityId };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        university: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, users, 'Users retrieved successfully');
  });

  /**
   * Delete User
   * DELETE /api/v1/users/:id
   */
  static delete = asyncHandler<AuthRequest>(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    // Get the user to be deleted
    const userToDelete = await prisma.user.findFirst({
      where: {
        id,
        universityId: user.roles.includes(UserRole.SUPER_ADMIN) ? undefined : user.universityId,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        university: true,
      },
    });

    if (!userToDelete) {
      throw new AppError(404, 'User not found');
    }

    // Prevent deleting SUPER_ADMIN users by non-SUPER_ADMIN users
    const isTargetSuperAdmin = userToDelete.userRoles.some(ur => ur.role.name === UserRole.SUPER_ADMIN);
    if (isTargetSuperAdmin && !user.roles.includes(UserRole.SUPER_ADMIN)) {
      throw new AppError(403, 'Cannot delete SUPER_ADMIN users');
    }

    // Log audit before deletion
    await AuditService.log({
      universityId: userToDelete.universityId || user.universityId,
      userId: user.userId,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      beforeState: {
        email: userToDelete.email,
        firstName: userToDelete.firstName,
        lastName: userToDelete.lastName,
        roles: userToDelete.userRoles.map(ur => ur.role.name),
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Delete user (this will cascade delete userRoles due to Prisma relations)
    await prisma.user.delete({
      where: { id },
    });

    logger.info(`User deleted: ${userToDelete.email} by ${user.userId}`);

    sendSuccess(res, null, 'User deleted successfully');
  });
}
