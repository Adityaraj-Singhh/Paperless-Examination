import { Request, Response, NextFunction } from 'express';
import { Permission, UserRole } from '@paperless/shared';
import { AppError } from './errorHandler';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';

/**
 * Permission Checking Middleware
 * Validates if user has specific permission based on their roles
 */
export const requirePermission = (permission: Permission) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        throw new AppError(401, 'User not authenticated');
      }

      // Debug logging
      console.log('🔍 Permission Check:', {
        permission,
        userRoles: authReq.user.roles,
        userId: authReq.user.userId,
        universityId: authReq.user.universityId
      });

      // SUPER_ADMIN has all permissions
      if (authReq.user.roles.includes(UserRole.SUPER_ADMIN)) {
        console.log('✅ SUPER_ADMIN detected - bypassing permission check');
        next();
        return;
      }

      // Check if user has permission through their roles
      const hasPermission = await checkUserPermission(
        authReq.user.userId,
        permission,
        authReq.user.universityId
      );

      if (!hasPermission) {
        throw new AppError(
          403,
          `Insufficient permissions. Required: ${permission}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has a specific permission
 */
export const checkUserPermission = async (
  userId: string,
  permission: Permission,
  universityId: string
): Promise<boolean> => {
  try {
    // Get user's roles
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        role: {
          universityId,
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Check if any role has the required permission
    for (const userRole of userRoles) {
      const rolePermissions = userRole.role.rolePermissions;
      const hasPermission = rolePermissions.some(
        (rp: any) => rp.permission.name === permission
      );

      if (hasPermission) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Multi-tenant Context Injection Middleware
 * Ensures all queries are scoped to user's university
 */
export const tenantContext = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    throw new AppError(401, 'User not authenticated');
  }

  // Tenant ID is already in JWT, just validate
  if (!authReq.user.universityId) {
    throw new AppError(403, 'No university context found');
  }

  next();
};

/**
 * Check Multiple Permissions (OR logic)
 */
export const requireAnyPermission = (...permissions: Permission[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        throw new AppError(401, 'User not authenticated');
      }

      // SUPER_ADMIN has all permissions
      if (authReq.user.roles.includes(UserRole.SUPER_ADMIN)) {
        next();
        return;
      }

      let hasPermission = false;

      for (const permission of permissions) {
        const allowed = await checkUserPermission(
          authReq.user.userId,
          permission,
          authReq.user.universityId
        );

        if (allowed) {
          hasPermission = true;
          break;
        }
      }

      if (!hasPermission) {
        throw new AppError(
          403,
          `Insufficient permissions. Required one of: ${permissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check Multiple Permissions (AND logic)
 */
export const requireAllPermissions = (...permissions: Permission[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        throw new AppError(401, 'User not authenticated');
      }

      // SUPER_ADMIN has all permissions
      if (authReq.user.roles.includes(UserRole.SUPER_ADMIN)) {
        next();
        return;
      }

      for (const permission of permissions) {
        const allowed = await checkUserPermission(
          authReq.user.userId,
          permission,
          authReq.user.universityId
        );

        if (!allowed) {
          throw new AppError(
            403,
            `Insufficient permissions. Required: ${permission}`
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
