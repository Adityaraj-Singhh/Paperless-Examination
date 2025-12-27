"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION_DEFAULTS = exports.AUTO_SAVE_INTERVAL = exports.RATE_LIMIT_CONFIG = exports.TOKEN_CONFIG = exports.EXAM_STATE_TRANSITIONS = exports.PERMISSION_ROLE_MAP = void 0;
const enums_1 = require("./enums");
/**
 * Permission to Role Mapping
 * Simplified to 4 roles: SUPER_ADMIN, ADMIN, TEACHER, STUDENT
 */
exports.PERMISSION_ROLE_MAP = {
    // University Management (SUPER_ADMIN only)
    [enums_1.Permission.CREATE_UNIVERSITY]: [enums_1.UserRole.SUPER_ADMIN],
    [enums_1.Permission.UPDATE_UNIVERSITY]: [enums_1.UserRole.SUPER_ADMIN],
    [enums_1.Permission.DELETE_UNIVERSITY]: [enums_1.UserRole.SUPER_ADMIN],
    [enums_1.Permission.VIEW_UNIVERSITY]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    // School Management (ADMIN manages schools in their university)
    [enums_1.Permission.CREATE_SCHOOL]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.UPDATE_SCHOOL]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.DELETE_SCHOOL]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.VIEW_SCHOOL]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN, enums_1.UserRole.TEACHER],
    // Department Management (ADMIN manages departments)
    [enums_1.Permission.CREATE_DEPARTMENT]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.UPDATE_DEPARTMENT]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.DELETE_DEPARTMENT]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.VIEW_DEPARTMENT]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN, enums_1.UserRole.TEACHER],
    // Programme Management (ADMIN manages programmes)
    [enums_1.Permission.CREATE_PROGRAMME]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.UPDATE_PROGRAMME]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.DELETE_PROGRAMME]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.VIEW_PROGRAMME]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN, enums_1.UserRole.TEACHER],
    // Course Management (ADMIN manages courses)
    [enums_1.Permission.CREATE_COURSE]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.UPDATE_COURSE]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.DELETE_COURSE]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.VIEW_COURSE]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN, enums_1.UserRole.TEACHER, enums_1.UserRole.STUDENT],
    // Exam Management (ADMIN creates exams, TEACHER conducts)
    [enums_1.Permission.CREATE_EXAM]: [enums_1.UserRole.ADMIN],
    [enums_1.Permission.UPDATE_EXAM]: [enums_1.UserRole.ADMIN],
    [enums_1.Permission.DELETE_EXAM]: [enums_1.UserRole.ADMIN],
    [enums_1.Permission.VIEW_EXAM]: [enums_1.UserRole.ADMIN, enums_1.UserRole.TEACHER],
    [enums_1.Permission.APPROVE_EXAM]: [enums_1.UserRole.ADMIN],
    [enums_1.Permission.PUBLISH_EXAM]: [enums_1.UserRole.ADMIN],
    // Question Management (TEACHER creates questions)
    [enums_1.Permission.CREATE_QUESTION]: [enums_1.UserRole.TEACHER],
    [enums_1.Permission.UPDATE_QUESTION]: [enums_1.UserRole.TEACHER],
    [enums_1.Permission.DELETE_QUESTION]: [enums_1.UserRole.TEACHER],
    [enums_1.Permission.VIEW_QUESTION]: [enums_1.UserRole.TEACHER, enums_1.UserRole.ADMIN],
    [enums_1.Permission.MODERATE_QUESTION]: [enums_1.UserRole.ADMIN],
    [enums_1.Permission.SEAL_QUESTION_BANK]: [enums_1.UserRole.ADMIN],
    // Paper Management (TEACHER generates, ADMIN approves)
    [enums_1.Permission.GENERATE_PAPER]: [enums_1.UserRole.TEACHER],
    [enums_1.Permission.APPROVE_PAPER]: [enums_1.UserRole.ADMIN],
    [enums_1.Permission.VIEW_PAPER]: [enums_1.UserRole.ADMIN, enums_1.UserRole.TEACHER],
    // Exam Conduction (TEACHER conducts, STUDENT takes)
    [enums_1.Permission.CONDUCT_EXAM]: [enums_1.UserRole.TEACHER],
    [enums_1.Permission.SUBMIT_EXAM]: [enums_1.UserRole.STUDENT],
    [enums_1.Permission.VIEW_EXAM_SESSION]: [enums_1.UserRole.ADMIN, enums_1.UserRole.TEACHER],
    // Evaluation (TEACHER evaluates)
    [enums_1.Permission.ASSIGN_EVALUATOR]: [enums_1.UserRole.ADMIN],
    [enums_1.Permission.EVALUATE_ANSWER]: [enums_1.UserRole.TEACHER],
    [enums_1.Permission.APPROVE_EVALUATION]: [enums_1.UserRole.ADMIN],
    [enums_1.Permission.VIEW_EVALUATION]: [enums_1.UserRole.TEACHER, enums_1.UserRole.ADMIN],
    // Results
    [enums_1.Permission.PUBLISH_RESULTS]: [enums_1.UserRole.ADMIN],
    [enums_1.Permission.VIEW_RESULTS]: [enums_1.UserRole.STUDENT, enums_1.UserRole.TEACHER, enums_1.UserRole.ADMIN],
    [enums_1.Permission.REQUEST_SCRUTINY]: [enums_1.UserRole.STUDENT],
    [enums_1.Permission.APPROVE_SCRUTINY]: [enums_1.UserRole.TEACHER, enums_1.UserRole.ADMIN],
    // User Management (SUPER_ADMIN creates admins, ADMIN creates teachers/students)
    [enums_1.Permission.CREATE_USER]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.UPDATE_USER]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.DELETE_USER]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.VIEW_USER]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    [enums_1.Permission.ASSIGN_ROLE]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    // Audit
    [enums_1.Permission.VIEW_AUDIT_LOGS]: [enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN],
    // Reports
    [enums_1.Permission.GENERATE_REPORTS]: [enums_1.UserRole.ADMIN, enums_1.UserRole.TEACHER],
    [enums_1.Permission.VIEW_ANALYTICS]: [enums_1.UserRole.ADMIN, enums_1.UserRole.TEACHER],
};
/**
 * Exam State Machine Transitions
 * Simplified for 4 roles: SUPER_ADMIN, ADMIN, TEACHER, STUDENT
 */
exports.EXAM_STATE_TRANSITIONS = [
    {
        from: enums_1.ExamState.DRAFT,
        to: enums_1.ExamState.COURSE_LOCKED,
        requiredPermission: enums_1.Permission.UPDATE_EXAM,
        requiredRole: [enums_1.UserRole.ADMIN],
    },
    {
        from: enums_1.ExamState.COURSE_LOCKED,
        to: enums_1.ExamState.GENERATED,
        requiredPermission: enums_1.Permission.GENERATE_PAPER,
        requiredRole: [enums_1.UserRole.TEACHER],
    },
    {
        from: enums_1.ExamState.GENERATED,
        to: enums_1.ExamState.APPROVED,
        requiredPermission: enums_1.Permission.APPROVE_PAPER,
        requiredRole: [enums_1.UserRole.ADMIN],
    },
    {
        from: enums_1.ExamState.APPROVED,
        to: enums_1.ExamState.READY,
        requiredPermission: enums_1.Permission.UPDATE_EXAM,
        requiredRole: [enums_1.UserRole.ADMIN],
    },
    {
        from: enums_1.ExamState.READY,
        to: enums_1.ExamState.OPEN,
        requiredPermission: enums_1.Permission.CONDUCT_EXAM,
        requiredRole: [enums_1.UserRole.TEACHER],
    },
    {
        from: enums_1.ExamState.OPEN,
        to: enums_1.ExamState.SUBMITTED,
        requiredPermission: enums_1.Permission.SUBMIT_EXAM,
        requiredRole: [enums_1.UserRole.STUDENT],
    },
    {
        from: enums_1.ExamState.SUBMITTED,
        to: enums_1.ExamState.EVALUATED,
        requiredPermission: enums_1.Permission.APPROVE_EVALUATION,
        requiredRole: [enums_1.UserRole.ADMIN],
    },
    {
        from: enums_1.ExamState.EVALUATED,
        to: enums_1.ExamState.PUBLISHED,
        requiredPermission: enums_1.Permission.PUBLISH_RESULTS,
        requiredRole: [enums_1.UserRole.ADMIN],
    },
    {
        from: enums_1.ExamState.PUBLISHED,
        to: enums_1.ExamState.CLOSED,
        requiredPermission: enums_1.Permission.UPDATE_EXAM,
        requiredRole: [enums_1.UserRole.ADMIN],
    },
];
/**
 * Token Configuration
 */
exports.TOKEN_CONFIG = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    BCRYPT_SALT_ROUNDS: 12,
};
/**
 * Rate Limiting Configuration
 */
exports.RATE_LIMIT_CONFIG = {
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
exports.AUTO_SAVE_INTERVAL = 30000; // 30 seconds
/**
 * Pagination Defaults
 */
exports.PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
};
//# sourceMappingURL=constants.js.map