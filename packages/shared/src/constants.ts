import { Permission, UserRole, ExamState } from './enums';
import { PermissionMap, ExamStateTransition } from './types';

/**
 * Permission to Role Mapping
 * Defines which roles have which permissions
 */
export const PERMISSION_ROLE_MAP: PermissionMap = {
  // University Management
  [Permission.CREATE_UNIVERSITY]: [UserRole.SUPER_ADMIN],
  [Permission.UPDATE_UNIVERSITY]: [UserRole.SUPER_ADMIN],
  [Permission.DELETE_UNIVERSITY]: [UserRole.SUPER_ADMIN],
  [Permission.VIEW_UNIVERSITY]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN],

  // School Management
  [Permission.CREATE_SCHOOL]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN],
  [Permission.UPDATE_SCHOOL]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN],
  [Permission.DELETE_SCHOOL]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN],
  [Permission.VIEW_SCHOOL]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN],

  // Department Management
  [Permission.CREATE_DEPARTMENT]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN],
  [Permission.UPDATE_DEPARTMENT]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN],
  [Permission.DELETE_DEPARTMENT]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN],
  [Permission.VIEW_DEPARTMENT]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN, UserRole.HOD],

  // Programme Management
  [Permission.CREATE_PROGRAMME]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN],
  [Permission.UPDATE_PROGRAMME]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN],
  [Permission.DELETE_PROGRAMME]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN],
  [Permission.VIEW_PROGRAMME]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN, UserRole.HOD],

  // Course Management
  [Permission.CREATE_COURSE]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.HOD],
  [Permission.UPDATE_COURSE]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.HOD],
  [Permission.DELETE_COURSE]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.HOD],
  [Permission.VIEW_COURSE]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN, UserRole.HOD, UserRole.TEACHER],

  // Exam Management
  [Permission.CREATE_EXAM]: [UserRole.EXAM_DEPT],
  [Permission.UPDATE_EXAM]: [UserRole.EXAM_DEPT],
  [Permission.DELETE_EXAM]: [UserRole.EXAM_DEPT],
  [Permission.VIEW_EXAM]: [UserRole.EXAM_DEPT, UserRole.DEAN, UserRole.HOD, UserRole.TEACHER],
  [Permission.APPROVE_EXAM]: [UserRole.DEAN],
  [Permission.PUBLISH_EXAM]: [UserRole.EXAM_DEPT],

  // Question Management
  [Permission.CREATE_QUESTION]: [UserRole.TEACHER],
  [Permission.UPDATE_QUESTION]: [UserRole.TEACHER],
  [Permission.DELETE_QUESTION]: [UserRole.TEACHER],
  [Permission.VIEW_QUESTION]: [UserRole.TEACHER, UserRole.HOD, UserRole.EVALUATOR],
  [Permission.MODERATE_QUESTION]: [UserRole.HOD],
  [Permission.SEAL_QUESTION_BANK]: [UserRole.HOD],

  // Paper Management
  [Permission.GENERATE_PAPER]: [UserRole.EXAM_DEPT, UserRole.HOD],
  [Permission.APPROVE_PAPER]: [UserRole.DEAN],
  [Permission.VIEW_PAPER]: [UserRole.DEAN, UserRole.HOD, UserRole.EXAM_DEPT],

  // Exam Conduction
  [Permission.CONDUCT_EXAM]: [UserRole.EXAM_DEPT],
  [Permission.SUBMIT_EXAM]: [UserRole.STUDENT],
  [Permission.VIEW_EXAM_SESSION]: [UserRole.EXAM_DEPT, UserRole.DEAN, UserRole.HOD],

  // Evaluation
  [Permission.ASSIGN_EVALUATOR]: [UserRole.EXAM_DEPT, UserRole.HOD],
  [Permission.EVALUATE_ANSWER]: [UserRole.TEACHER, UserRole.EVALUATOR],
  [Permission.APPROVE_EVALUATION]: [UserRole.HOD],
  [Permission.VIEW_EVALUATION]: [UserRole.TEACHER, UserRole.EVALUATOR, UserRole.HOD],

  // Results
  [Permission.PUBLISH_RESULTS]: [UserRole.EXAM_DEPT],
  [Permission.VIEW_RESULTS]: [UserRole.STUDENT, UserRole.TEACHER, UserRole.HOD, UserRole.DEAN],
  [Permission.REQUEST_SCRUTINY]: [UserRole.STUDENT],
  [Permission.APPROVE_SCRUTINY]: [UserRole.TEACHER, UserRole.HOD, UserRole.DEAN],

  // User Management
  [Permission.CREATE_USER]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN],
  [Permission.UPDATE_USER]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN],
  [Permission.DELETE_USER]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN],
  [Permission.VIEW_USER]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN, UserRole.HOD],
  [Permission.ASSIGN_ROLE]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN],

  // Audit
  [Permission.VIEW_AUDIT_LOGS]: [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.DEAN],

  // Reports
  [Permission.GENERATE_REPORTS]: [UserRole.DEAN, UserRole.HOD, UserRole.EXAM_DEPT],
  [Permission.VIEW_ANALYTICS]: [UserRole.DEAN, UserRole.HOD, UserRole.EXAM_DEPT],
};

/**
 * Exam State Machine Transitions
 * Defines valid state transitions and required permissions
 */
export const EXAM_STATE_TRANSITIONS: ExamStateTransition[] = [
  {
    from: ExamState.DRAFT,
    to: ExamState.COURSE_LOCKED,
    requiredPermission: Permission.UPDATE_EXAM,
    requiredRole: [UserRole.DEAN],
  },
  {
    from: ExamState.COURSE_LOCKED,
    to: ExamState.GENERATED,
    requiredPermission: Permission.GENERATE_PAPER,
    requiredRole: [UserRole.EXAM_DEPT, UserRole.HOD],
  },
  {
    from: ExamState.GENERATED,
    to: ExamState.APPROVED,
    requiredPermission: Permission.APPROVE_PAPER,
    requiredRole: [UserRole.DEAN],
  },
  {
    from: ExamState.APPROVED,
    to: ExamState.READY,
    requiredPermission: Permission.UPDATE_EXAM,
    requiredRole: [UserRole.EXAM_DEPT],
  },
  {
    from: ExamState.READY,
    to: ExamState.OPEN,
    requiredPermission: Permission.CONDUCT_EXAM,
    requiredRole: [UserRole.EXAM_DEPT],
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
    requiredRole: [UserRole.HOD],
  },
  {
    from: ExamState.EVALUATED,
    to: ExamState.PUBLISHED,
    requiredPermission: Permission.PUBLISH_RESULTS,
    requiredRole: [UserRole.EXAM_DEPT],
  },
  {
    from: ExamState.PUBLISHED,
    to: ExamState.CLOSED,
    requiredPermission: Permission.UPDATE_EXAM,
    requiredRole: [UserRole.EXAM_DEPT],
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
