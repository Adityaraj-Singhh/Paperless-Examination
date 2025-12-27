"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = exports.ScrutinyStatus = exports.EvaluationStatus = exports.PaperStatus = exports.DifficultyLevel = exports.BloomLevel = exports.QuestionType = exports.ExamState = exports.Permission = exports.UserRole = void 0;
/**
 * User Roles in the System
 * SUPER_ADMIN: Can create universities and admins
 * ADMIN: University administrator who manages schools, departments, teachers
 * TEACHER: Can create questions, conduct exams, evaluate
 * STUDENT: Can take exams and view results
 */
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["STUDENT"] = "STUDENT";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * System Permissions
 */
var Permission;
(function (Permission) {
    // University Management
    Permission["CREATE_UNIVERSITY"] = "CREATE_UNIVERSITY";
    Permission["UPDATE_UNIVERSITY"] = "UPDATE_UNIVERSITY";
    Permission["DELETE_UNIVERSITY"] = "DELETE_UNIVERSITY";
    Permission["VIEW_UNIVERSITY"] = "VIEW_UNIVERSITY";
    // School Management
    Permission["CREATE_SCHOOL"] = "CREATE_SCHOOL";
    Permission["UPDATE_SCHOOL"] = "UPDATE_SCHOOL";
    Permission["DELETE_SCHOOL"] = "DELETE_SCHOOL";
    Permission["VIEW_SCHOOL"] = "VIEW_SCHOOL";
    // Department Management
    Permission["CREATE_DEPARTMENT"] = "CREATE_DEPARTMENT";
    Permission["UPDATE_DEPARTMENT"] = "UPDATE_DEPARTMENT";
    Permission["DELETE_DEPARTMENT"] = "DELETE_DEPARTMENT";
    Permission["VIEW_DEPARTMENT"] = "VIEW_DEPARTMENT";
    // Programme Management
    Permission["CREATE_PROGRAMME"] = "CREATE_PROGRAMME";
    Permission["UPDATE_PROGRAMME"] = "UPDATE_PROGRAMME";
    Permission["DELETE_PROGRAMME"] = "DELETE_PROGRAMME";
    Permission["VIEW_PROGRAMME"] = "VIEW_PROGRAMME";
    // Course Management
    Permission["CREATE_COURSE"] = "CREATE_COURSE";
    Permission["UPDATE_COURSE"] = "UPDATE_COURSE";
    Permission["DELETE_COURSE"] = "DELETE_COURSE";
    Permission["VIEW_COURSE"] = "VIEW_COURSE";
    // Exam Management
    Permission["CREATE_EXAM"] = "CREATE_EXAM";
    Permission["UPDATE_EXAM"] = "UPDATE_EXAM";
    Permission["DELETE_EXAM"] = "DELETE_EXAM";
    Permission["VIEW_EXAM"] = "VIEW_EXAM";
    Permission["APPROVE_EXAM"] = "APPROVE_EXAM";
    Permission["PUBLISH_EXAM"] = "PUBLISH_EXAM";
    // Question Management
    Permission["CREATE_QUESTION"] = "CREATE_QUESTION";
    Permission["UPDATE_QUESTION"] = "UPDATE_QUESTION";
    Permission["DELETE_QUESTION"] = "DELETE_QUESTION";
    Permission["VIEW_QUESTION"] = "VIEW_QUESTION";
    Permission["MODERATE_QUESTION"] = "MODERATE_QUESTION";
    Permission["SEAL_QUESTION_BANK"] = "SEAL_QUESTION_BANK";
    // Paper Management
    Permission["GENERATE_PAPER"] = "GENERATE_PAPER";
    Permission["APPROVE_PAPER"] = "APPROVE_PAPER";
    Permission["VIEW_PAPER"] = "VIEW_PAPER";
    // Exam Conduction
    Permission["CONDUCT_EXAM"] = "CONDUCT_EXAM";
    Permission["SUBMIT_EXAM"] = "SUBMIT_EXAM";
    Permission["VIEW_EXAM_SESSION"] = "VIEW_EXAM_SESSION";
    // Evaluation
    Permission["ASSIGN_EVALUATOR"] = "ASSIGN_EVALUATOR";
    Permission["EVALUATE_ANSWER"] = "EVALUATE_ANSWER";
    Permission["APPROVE_EVALUATION"] = "APPROVE_EVALUATION";
    Permission["VIEW_EVALUATION"] = "VIEW_EVALUATION";
    // Results
    Permission["PUBLISH_RESULTS"] = "PUBLISH_RESULTS";
    Permission["VIEW_RESULTS"] = "VIEW_RESULTS";
    Permission["REQUEST_SCRUTINY"] = "REQUEST_SCRUTINY";
    Permission["APPROVE_SCRUTINY"] = "APPROVE_SCRUTINY";
    // User Management
    Permission["CREATE_USER"] = "CREATE_USER";
    Permission["UPDATE_USER"] = "UPDATE_USER";
    Permission["DELETE_USER"] = "DELETE_USER";
    Permission["VIEW_USER"] = "VIEW_USER";
    Permission["ASSIGN_ROLE"] = "ASSIGN_ROLE";
    // Audit
    Permission["VIEW_AUDIT_LOGS"] = "VIEW_AUDIT_LOGS";
    // Reports
    Permission["GENERATE_REPORTS"] = "GENERATE_REPORTS";
    Permission["VIEW_ANALYTICS"] = "VIEW_ANALYTICS";
})(Permission || (exports.Permission = Permission = {}));
/**
 * Exam Workflow States
 */
var ExamState;
(function (ExamState) {
    ExamState["DRAFT"] = "DRAFT";
    ExamState["COURSE_LOCKED"] = "COURSE_LOCKED";
    ExamState["GENERATED"] = "GENERATED";
    ExamState["APPROVED"] = "APPROVED";
    ExamState["READY"] = "READY";
    ExamState["OPEN"] = "OPEN";
    ExamState["SUBMITTED"] = "SUBMITTED";
    ExamState["EVALUATED"] = "EVALUATED";
    ExamState["PUBLISHED"] = "PUBLISHED";
    ExamState["CLOSED"] = "CLOSED";
})(ExamState || (exports.ExamState = ExamState = {}));
/**
 * Question Types
 */
var QuestionType;
(function (QuestionType) {
    QuestionType["OBJECTIVE"] = "OBJECTIVE";
    QuestionType["SUBJECTIVE"] = "SUBJECTIVE";
    QuestionType["TRUE_FALSE"] = "TRUE_FALSE";
    QuestionType["FILL_IN_BLANK"] = "FILL_IN_BLANK";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
/**
 * Bloom's Taxonomy Levels (Revised)
 */
var BloomLevel;
(function (BloomLevel) {
    BloomLevel["REMEMBER"] = "REMEMBER";
    BloomLevel["UNDERSTAND"] = "UNDERSTAND";
    BloomLevel["APPLY"] = "APPLY";
    BloomLevel["ANALYZE"] = "ANALYZE";
    BloomLevel["EVALUATE"] = "EVALUATE";
    BloomLevel["CREATE"] = "CREATE";
})(BloomLevel || (exports.BloomLevel = BloomLevel = {}));
/**
 * Question Difficulty Levels
 */
var DifficultyLevel;
(function (DifficultyLevel) {
    DifficultyLevel["EASY"] = "EASY";
    DifficultyLevel["MEDIUM"] = "MEDIUM";
    DifficultyLevel["HARD"] = "HARD";
})(DifficultyLevel || (exports.DifficultyLevel = DifficultyLevel = {}));
/**
 * Paper Status
 */
var PaperStatus;
(function (PaperStatus) {
    PaperStatus["DRAFT"] = "DRAFT";
    PaperStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    PaperStatus["APPROVED"] = "APPROVED";
    PaperStatus["REJECTED"] = "REJECTED";
})(PaperStatus || (exports.PaperStatus = PaperStatus = {}));
/**
 * Evaluation Status
 */
var EvaluationStatus;
(function (EvaluationStatus) {
    EvaluationStatus["PENDING"] = "PENDING";
    EvaluationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    EvaluationStatus["COMPLETED"] = "COMPLETED";
    EvaluationStatus["APPROVED"] = "APPROVED";
})(EvaluationStatus || (exports.EvaluationStatus = EvaluationStatus = {}));
/**
 * Scrutiny Status
 */
var ScrutinyStatus;
(function (ScrutinyStatus) {
    ScrutinyStatus["REQUESTED"] = "REQUESTED";
    ScrutinyStatus["TEACHER_REVIEW"] = "TEACHER_REVIEW";
    ScrutinyStatus["HOD_REVIEW"] = "HOD_REVIEW";
    ScrutinyStatus["DEAN_REVIEW"] = "DEAN_REVIEW";
    ScrutinyStatus["APPROVED"] = "APPROVED";
    ScrutinyStatus["REJECTED"] = "REJECTED";
})(ScrutinyStatus || (exports.ScrutinyStatus = ScrutinyStatus = {}));
/**
 * Audit Action Types
 */
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["STATE_CHANGE"] = "STATE_CHANGE";
    AuditAction["APPROVAL"] = "APPROVAL";
    AuditAction["REJECTION"] = "REJECTION";
    AuditAction["EVALUATION"] = "EVALUATION";
    AuditAction["SUBMISSION"] = "SUBMISSION";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
//# sourceMappingURL=enums.js.map