import { Permission, UserRole, ExamState } from './enums';
import { PermissionMap, ExamStateTransition } from './types';

/**
 * Permission to Role Mapping
 * Simplified to 4 roles: SUPER_ADMIN, ADMIN, TEACHER, STUDENT
 */
export const PERMISSION_ROLE_MAP: PermissionMap = {
  // University Management (SUPER_ADMIN only)
  [Permission.CREATE_UNIVERSITY]: [UserRole.SUPER_ADMIN],
  [Permission.UPDATE_UNIVERSITY]: [UserRole.SUPER_ADMIN],
  [Permission.DELETE_UNIVERSITY]: [UserRole.SUPER_ADMIN],
  [Permission.VIEW_UNIVERSITY]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],

  // School Management (ADMIN manages schools in their university)
  [Permission.CREATE_SCHOOL]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.UPDATE_SCHOOL]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.DELETE_SCHOOL]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.VIEW_SCHOOL]: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER],

  // Department Management (ADMIN manages departments)
  [Permission.CREATE_DEPARTMENT]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.UPDATE_DEPARTMENT]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.DELETE_DEPARTMENT]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.VIEW_DEPARTMENT]: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER],

  // Programme Management (ADMIN manages programmes)
  [Permission.CREATE_PROGRAMME]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.UPDATE_PROGRAMME]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.DELETE_PROGRAMME]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.VIEW_PROGRAMME]: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER],

  // Course Management (ADMIN manages courses)
  [Permission.CREATE_COURSE]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.UPDATE_COURSE]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.DELETE_COURSE]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.VIEW_COURSE]: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],

  // Exam Management (ADMIN creates exams, TEACHER conducts)
  [Permission.CREATE_EXAM]: [UserRole.ADMIN],
  [Permission.UPDATE_EXAM]: [UserRole.ADMIN],
  [Permission.DELETE_EXAM]: [UserRole.ADMIN],
  [Permission.VIEW_EXAM]: [UserRole.ADMIN, UserRole.TEACHER],
  [Permission.APPROVE_EXAM]: [UserRole.ADMIN],
  [Permission.PUBLISH_EXAM]: [UserRole.ADMIN],

  // Question Management (TEACHER creates questions)
  [Permission.CREATE_QUESTION]: [UserRole.TEACHER],
  [Permission.UPDATE_QUESTION]: [UserRole.TEACHER],
  [Permission.DELETE_QUESTION]: [UserRole.TEACHER],
  [Permission.VIEW_QUESTION]: [UserRole.TEACHER, UserRole.ADMIN],
  [Permission.MODERATE_QUESTION]: [UserRole.ADMIN],
  [Permission.SEAL_QUESTION_BANK]: [UserRole.ADMIN],

  // Paper Management (TEACHER generates, ADMIN approves)
  [Permission.GENERATE_PAPER]: [UserRole.TEACHER],
  [Permission.APPROVE_PAPER]: [UserRole.ADMIN],
  [Permission.VIEW_PAPER]: [UserRole.ADMIN, UserRole.TEACHER],

  // Exam Conduction (TEACHER conducts, STUDENT takes)
  [Permission.CONDUCT_EXAM]: [UserRole.TEACHER],
  [Permission.SUBMIT_EXAM]: [UserRole.STUDENT],
  [Permission.VIEW_EXAM_SESSION]: [UserRole.ADMIN, UserRole.TEACHER],

  // Evaluation (TEACHER evaluates)
  [Permission.ASSIGN_EVALUATOR]: [UserRole.ADMIN],
  [Permission.EVALUATE_ANSWER]: [UserRole.TEACHER],
  [Permission.APPROVE_EVALUATION]: [UserRole.ADMIN],
  [Permission.VIEW_EVALUATION]: [UserRole.TEACHER, UserRole.ADMIN],

  // Results
  [Permission.PUBLISH_RESULTS]: [UserRole.ADMIN],
  [Permission.VIEW_RESULTS]: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN],
  [Permission.REQUEST_SCRUTINY]: [UserRole.STUDENT],
  [Permission.APPROVE_SCRUTINY]: [UserRole.TEACHER, UserRole.ADMIN],

  // User Management (SUPER_ADMIN creates admins, ADMIN creates teachers/students)
  [Permission.CREATE_USER]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.UPDATE_USER]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.DELETE_USER]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.VIEW_USER]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Permission.ASSIGN_ROLE]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],

  // Audit
  [Permission.VIEW_AUDIT_LOGS]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],

  // Reports
  [Permission.GENERATE_REPORTS]: [UserRole.ADMIN, UserRole.TEACHER],
  [Permission.VIEW_ANALYTICS]: [UserRole.ADMIN, UserRole.TEACHER],
};

/**
 * Exam State Machine Transitions
 * Simplified for 4 roles: SUPER_ADMIN, ADMIN, TEACHER, STUDENT
 */
export const EXAM_STATE_TRANSITIONS: ExamStateTransition[] = [
  {
    from: ExamState.DRAFT,
    to: ExamState.COURSE_LOCKED,
    requiredPermission: Permission.UPDATE_EXAM,
    requiredRole: [UserRole.ADMIN],
  },
  {
    from: ExamState.COURSE_LOCKED,
    to: ExamState.GENERATED,
    requiredPermission: Permission.GENERATE_PAPER,
    requiredRole: [UserRole.TEACHER],
  },
  {
    from: ExamState.GENERATED,
    to: ExamState.APPROVED,
    requiredPermission: Permission.APPROVE_PAPER,
    requiredRole: [UserRole.ADMIN],
  },
  {
    from: ExamState.APPROVED,
    to: ExamState.READY,
    requiredPermission: Permission.UPDATE_EXAM,
    requiredRole: [UserRole.ADMIN],
  },
  {
    from: ExamState.READY,
    to: ExamState.OPEN,
    requiredPermission: Permission.CONDUCT_EXAM,
    requiredRole: [UserRole.TEACHER],
  },
  {
    from: ExamState.OPEN,
    to: ExamState.SUBMITTED,
    requiredPermission: Permission.SUBMIT_EXAM,
    requiredRole: [UserRole.STUDENT],
  },
  {
    from: ExamState.SUBMITTED,
    to: ExamState.EVALUATED,
    requiredPermission: Permission.APPROVE_EVALUATION,
    requiredRole: [UserRole.ADMIN],
  },
  {
    from: ExamState.EVALUATED,
    to: ExamState.PUBLISHED,
    requiredPermission: Permission.PUBLISH_RESULTS,
    requiredRole: [UserRole.ADMIN],
  },
  {
    from: ExamState.PUBLISHED,
    to: ExamState.CLOSED,
    requiredPermission: Permission.UPDATE_EXAM,
    requiredRole: [UserRole.ADMIN],
  },
];

/**
 * Token Configuration
 */
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  BCRYPT_SALT_ROUNDS: 12,
};

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMIT_CONFIG = {
  AUTH_ENDPOINTS: {
    points: 100,
    duration: 15 * 60, // 15 minutes
  },
  API_ENDPOINTS: {
    points: 1000,
    duration: 15 * 60,
  },
};

/**
 * Auto-save Configuration
 */
export const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Pagination Defaults
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};
