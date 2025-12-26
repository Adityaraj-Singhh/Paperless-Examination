import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '@paperless/shared';
import { AppError } from './errorHandler';

/**
 * Extended Request with User Context
 */
export interface AuthRequest extends Request {
  user: JWTPayload;
}

/**
 * JWT Authentication Middleware
 * Validates access token and attaches user context to request
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Note: Token blacklisting requires Redis/cache
    // Tokens are valid until expiry

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as JWTPayload;

    // Attach user to request
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Role-based Access Control Middleware
 * Checks if user has any of the required roles
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const hasRole = authReq.user.roles.some((role: UserRole) => roles.includes(role));

    if (!hasRole) {
      throw new AppError(
        403,
        `Access denied. Required roles: ${roles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Optional Authentication
 * Attaches user if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET!
      ) as JWTPayload;
      (req as AuthRequest).user = decoded;
    }

    next();
  } catch (error) {
    // Don't throw error for optional auth
    next();
  }
};
