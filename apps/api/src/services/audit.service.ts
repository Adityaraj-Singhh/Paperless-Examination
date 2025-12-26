import { AuditAction } from '@paperless/shared';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

/**
 * Audit Log Service
 * Immutable append-only logging of all critical actions
 */
export class AuditService {
  /**
   * Log an action
   */
  static async log({
    universityId,
    userId,
    action,
    entityType,
    entityId,
    beforeState,
    afterState,
    ipAddress,
    userAgent,
  }: {
    universityId: string;
    userId?: string;
    action: AuditAction | string;
    entityType: string;
    entityId: string;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          universityId,
          userId,
          action,
          entityType,
          entityId,
          beforeState: beforeState as any,
          afterState: afterState as any,
          ipAddress,
          userAgent,
        },
      });

      logger.info(
        `Audit: ${action} on ${entityType}:${entityId} by user ${userId || 'system'}`
      );
    } catch (error) {
      // Never fail the request due to audit logging errors
      logger.error('Audit log failed:', error);
    }
  }

  /**
   * Log State Change
   */
  static async logStateChange({
    universityId,
    userId,
    entityType,
    entityId,
    fromState,
    toState,
    ipAddress,
    userAgent,
  }: {
    universityId: string;
    userId: string;
    entityType: string;
    entityId: string;
    fromState: string;
    toState: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      universityId,
      userId,
      action: AuditAction.STATE_CHANGE,
      entityType,
      entityId,
      beforeState: { state: fromState },
      afterState: { state: toState },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log Login
   */
  static async logLogin({
    universityId,
    userId,
    ipAddress,
    userAgent,
  }: {
    universityId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      universityId,
      userId,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log Logout
   */
  static async logLogout({
    universityId,
    userId,
    ipAddress,
    userAgent,
  }: {
    universityId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      universityId,
      userId,
      action: AuditAction.LOGOUT,
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get Audit Logs with Filtering
   */
  static async getLogs({
    universityId,
    userId,
    entityType,
    entityId,
    action,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  }: {
    universityId: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: any = { universityId };

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}
