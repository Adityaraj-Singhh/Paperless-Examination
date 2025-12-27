import { PermissionMap, ExamStateTransition } from './types';
/**
 * Permission to Role Mapping
 * Simplified to 4 roles: SUPER_ADMIN, ADMIN, TEACHER, STUDENT
 */
export declare const PERMISSION_ROLE_MAP: PermissionMap;
/**
 * Exam State Machine Transitions
 * Simplified for 4 roles: SUPER_ADMIN, ADMIN, TEACHER, STUDENT
 */
export declare const EXAM_STATE_TRANSITIONS: ExamStateTransition[];
/**
 * Token Configuration
 */
export declare const TOKEN_CONFIG: {
    ACCESS_TOKEN_EXPIRY: string;
    REFRESH_TOKEN_EXPIRY: string;
    BCRYPT_SALT_ROUNDS: number;
};
/**
 * Rate Limiting Configuration
 */
export declare const RATE_LIMIT_CONFIG: {
    AUTH_ENDPOINTS: {
        points: number;
        duration: number;
    };
    API_ENDPOINTS: {
        points: number;
        duration: number;
    };
};
/**
 * Auto-save Configuration
 */
export declare const AUTO_SAVE_INTERVAL = 30000;
/**
 * Pagination Defaults
 */
export declare const PAGINATION_DEFAULTS: {
    PAGE: number;
    LIMIT: number;
    MAX_LIMIT: number;
};
//# sourceMappingURL=constants.d.ts.map