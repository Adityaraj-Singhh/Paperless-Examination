import { UserRole, Permission, ExamState, QuestionType, BloomLevel, DifficultyLevel } from './enums';

/**
 * JWT Token Payload
 */
export interface JWTPayload {
  userId: string;
  universityId: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

/**
 * Auth Response
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    universityId: string;
    roles: UserRole[];
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Permission Map
 */
export type PermissionMap = {
  [key in Permission]: UserRole[];
};

/**
 * API Error Response
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * API Success Response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  universityId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Exam State Transition
 */
export interface ExamStateTransition {
  from: ExamState;
  to: ExamState;
  requiredPermission: Permission;
  requiredRole?: UserRole[];
}

/**
 * Question Blueprint
 */
export interface QuestionBlueprint {
  bloomLevel: BloomLevel;
  difficulty: DifficultyLevel;
  marks: number;
  count: number;
}

/**
 * Paper Generation Constraints
 */
export interface PaperGenerationConstraints {
  totalMarks: number;
  totalQuestions: number;
  bloomDistribution: Record<BloomLevel, number>;
  difficultyDistribution: Record<DifficultyLevel, number>;
  coDistribution?: Record<string, number>;
}

/**
 * AI Evaluation Result
 */
export interface AIEvaluationResult {
  extractedText: string;
  detectedLanguage: string;
  translatedText?: string;
  suggestedMarks: number;
  confidence: number;
  feedback?: string;
}
