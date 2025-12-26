# 🎓 Paperless Examination System - Getting Started Guide

Welcome to the Paperless Examination System! This guide will help you understand the system and get started with development.

## 📚 Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Architecture Explained](#architecture-explained)
4. [Key Features](#key-features)
5. [Development Workflow](#development-workflow)
6. [Testing Guide](#testing-guide)
7. [Deployment Guide](#deployment-guide)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

## Project Overview

### What is This System?

A comprehensive, production-ready examination management platform that supports:
- **Multiple Universities** (Multi-tenant architecture)
- **Various Exam Types** (Objective, Subjective, Mixed)
- **AI-Assisted Evaluation** (OCR + Natural Language Processing)
- **Strict Role-Based Access Control** (RBAC)
- **Complete Audit Trails** (Every action logged)
- **Secure Paper Generation** (Encrypted, 2FA approval)
- **Real-time Exam Conduction** (Auto-save, handwriting support)

### Technology Stack

**Frontend**:
- Next.js 14+ (React framework with App Router)
- TypeScript (Type safety)
- Tailwind CSS (Utility-first CSS)
- Shadcn/ui (Component library)
- Zustand (State management)
- TanStack Query (Server state)
- React Hook Form + Zod (Form validation)

**Backend**:
- Node.js 20+ with Express.js
- TypeScript
- Prisma ORM (Database toolkit)
- PostgreSQL (Relational database)
- Redis (Caching & sessions)
- JWT (Authentication)
- Winston (Logging)

**Security**:
- bcrypt (Password hashing)
- Helmet (HTTP security headers)
- Rate limiting (DDoS protection)
- Input validation (XSS/SQL injection prevention)

## Quick Start

### Prerequisites Check

```bash
# Check Node.js version (should be 20+)
node --version

# Check PostgreSQL (should be 15+)
psql --version

# Check Redis
redis-cli --version
```

### Installation (5 minutes)

```bash
# 1. Clone repository
git clone <repo-url>
cd paperless-exam-system

# 2. Install dependencies
npm install

# 3. Setup backend environment
cd apps/api
cp .env.example .env
# Edit .env with your database credentials

# 4. Setup database
npm run prisma:migrate
npm run prisma:generate

# 5. Setup frontend environment
cd ../web
cp .env.example .env

# 6. Start development servers (from root)
cd ../..
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Prisma Studio**: http://localhost:5555 (run `npm run prisma:studio` in apps/api)

## Architecture Explained

### Multi-Tenant Design

Every university is a separate tenant with complete data isolation:

```
University A                    University B
├── Schools                     ├── Schools
├── Departments                 ├── Departments
├── Users                       ├── Users
├── Exams                       ├── Exams
└── [Isolated Data]            └── [Isolated Data]
```

All database queries automatically filter by `universityId` from the user's JWT token.

### Role-Based Access Control (RBAC)

```
User → UserRole → Role → RolePermission → Permission
```

Example:
- User: john@university.edu
- Role: EXAM_DEPT
- Permissions: CREATE_EXAM, GENERATE_PAPER, PUBLISH_RESULTS

Middleware checks permissions before allowing actions.

### Request Flow

```
Client → Next.js → API Client → Express API → Middleware → Controller → Service → Prisma → Database
                                     ↓
                              [Auth, RBAC, Rate Limit, Validation]
```

### Database Schema Highlights

```
universities (root tenant)
  ├── schools
  │     └── departments
  │           └── programmes
  │                 └── courses
  │
  ├── users
  │     └── user_roles → roles → role_permissions → permissions
  │
  ├── exams
  │     ├── exam_courses
  │     └── papers
  │           ├── paper_sections
  │           └── paper_questions → questions
  │
  ├── exam_sessions
  │     └── student_answers
  │           └── ai_evaluations
  │
  └── audit_logs (immutable)
```

## Key Features

### 1. Authentication System ✅

**Implemented Features**:
- User registration with email/password
- Secure login with JWT tokens
- Access token (15min) + Refresh token (7 days)
- Token refresh mechanism
- Logout with token blacklisting
- Password change with re-authentication
- Profile management

**Try It**:
```bash
# Register a user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User",
    "universityId": "<uuid>"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123"
  }'
```

### 2. Permission System ✅

**How It Works**:
```typescript
// Backend route protection
router.post('/exams',
  authenticate,                        // Verify JWT
  requirePermission(Permission.CREATE_EXAM), // Check permission
  examController.create                // Execute
);

// Frontend role check
const { hasRole } = useAuth();

{hasRole(UserRole.EXAM_DEPT) && (
  <Button>Create Exam</Button>
)}
```

### 3. Audit Logging ✅

**All Actions Tracked**:
- Who did what
- When they did it
- What changed (before/after state)
- IP address & user agent
- Immutable (append-only)

**Example**:
```typescript
await AuditService.log({
  universityId,
  userId,
  action: AuditAction.CREATE,
  entityType: 'Exam',
  entityId: exam.id,
  afterState: examData,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
```

### 4. Multi-Tenant Queries ✅

**Automatic Tenant Filtering**:
```typescript
// User's universityId is in JWT token
// Middleware injects it into request

const courses = await prisma.course.findMany({
  where: {
    universityId: req.user.universityId, // Auto-scoped
    departmentId: req.params.departmentId
  }
});
```

## Development Workflow

### Adding a New Feature

#### 1. Define Types (packages/shared)

```typescript
// packages/shared/src/types.ts
export interface Exam {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}
```

#### 2. Update Database Schema (apps/api/prisma/schema.prisma)

```prisma
model Exam {
  id        String   @id @default(uuid())
  universityId String
  name      String
  startDate DateTime
  endDate   DateTime
  // ... more fields
  
  university University @relation(fields: [universityId], references: [id])
  
  @@index([universityId])
  @@map("exams")
}
```

Run migration:
```bash
cd apps/api
npx prisma migrate dev --name add_exam_table
```

#### 3. Create Service (apps/api/src/services)

```typescript
// apps/api/src/services/exam.service.ts
export class ExamService {
  static async createExam(data: CreateExamInput, universityId: string) {
    // Audit log before
    const exam = await prisma.exam.create({
      data: { ...data, universityId }
    });
    // Audit log after
    return exam;
  }
}
```

#### 4. Create Controller (apps/api/src/controllers)

```typescript
// apps/api/src/controllers/exam.controller.ts
export class ExamController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const exam = await ExamService.createExam(
      req.body,
      authReq.user.universityId
    );
    sendSuccess(res, exam, 'Exam created successfully', 201);
  });
}
```

#### 5. Create Routes (apps/api/src/routes)

```typescript
// apps/api/src/routes/exam.routes.ts
router.post('/',
  authenticate,
  requirePermission(Permission.CREATE_EXAM),
  validate(createExamValidation),
  ExamController.create
);
```

#### 6. Add to Main Router (apps/api/src/app.ts)

```typescript
import examRoutes from './routes/exam.routes';
this.app.use('/api/v1/exams', examRoutes);
```

#### 7. Create API Client Method (apps/web/src/lib/api-client.ts)

```typescript
export const api = {
  exams: {
    create: (data: CreateExamInput) =>
      apiClient.post<ApiResponse<Exam>>('/exams', data),
    list: (params?: PaginationParams) =>
      apiClient.get<ApiResponse<Exam[]>>('/exams', { params }),
  },
};
```

#### 8. Create Frontend Page (apps/web/src/app)

```typescript
// apps/web/src/app/exams/create/page.tsx
'use client';

export default function CreateExamPage() {
  const { mutate } = useMutation({
    mutationFn: (data: CreateExamInput) => api.exams.create(data),
    onSuccess: () => {
      toast.success('Exam created!');
      router.push('/exams');
    },
  });

  return <ExamForm onSubmit={mutate} />;
}
```

### Code Style Guidelines

**TypeScript**:
- Use strict mode
- No `any` types (use `unknown` if necessary)
- Define interfaces for all data structures
- Use enums for constants

**Naming Conventions**:
- Files: kebab-case (`exam-controller.ts`)
- Classes: PascalCase (`ExamController`)
- Functions: camelCase (`createExam`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)

**Error Handling**:
```typescript
// Always use try-catch in async functions
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new AppError(500, 'Operation failed');
}

// Or use asyncHandler wrapper
const handler = asyncHandler(async (req, res) => {
  // Errors automatically caught and handled
  const result = await someAsyncOperation();
  sendSuccess(res, result);
});
```

## Testing Guide

### Unit Tests

```typescript
// apps/api/src/services/__tests__/exam.service.test.ts
describe('ExamService', () => {
  it('should create exam with valid data', async () => {
    const exam = await ExamService.createExam(mockData, universityId);
    expect(exam.id).toBeDefined();
    expect(exam.name).toBe(mockData.name);
  });

  it('should enforce multi-tenant isolation', async () => {
    // Test that users can't access other tenants' data
  });
});
```

### Integration Tests

```typescript
// Test full request flow
describe('POST /api/v1/exams', () => {
  it('should create exam with valid token', async () => {
    const response = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${validToken}`)
      .send(examData)
      .expect(201);

    expect(response.body.success).toBe(true);
  });

  it('should reject without permission', async () => {
    await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${tokenWithoutPermission}`)
      .send(examData)
      .expect(403);
  });
});
```

## Deployment Guide

### Production Checklist

- [ ] Change all environment secrets
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure production database (managed service)
- [ ] Setup Redis cluster
- [ ] Configure CDN for static assets
- [ ] Enable rate limiting
- [ ] Setup monitoring (logs, metrics, alerts)
- [ ] Configure automated backups
- [ ] Setup CI/CD pipeline
- [ ] Load testing
- [ ] Security audit

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f api
docker-compose logs -f web

# Stop services
docker-compose down
```

### PM2 Deployment

```bash
# Build applications
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs

# Restart
pm2 restart all
```

## Common Tasks

### Adding a New Permission

1. Add to enum (`packages/shared/src/enums.ts`):
```typescript
export enum Permission {
  // ...existing
  NEW_PERMISSION = 'NEW_PERMISSION',
}
```

2. Add to permission map (`packages/shared/src/constants.ts`):
```typescript
export const PERMISSION_ROLE_MAP: PermissionMap = {
  // ...existing
  [Permission.NEW_PERMISSION]: [UserRole.ADMIN, UserRole.TEACHER],
};
```

3. Use in routes:
```typescript
router.post('/resource', 
  requirePermission(Permission.NEW_PERMISSION),
  controller.action
);
```

### Adding a New Role

1. Add to enum (`packages/shared/src/enums.ts`)
2. Update permission mappings
3. Create seed data for role
4. Update UI role selectors

### Database Migration

```bash
cd apps/api

# Create migration
npx prisma migrate dev --name add_new_field

# Apply to production
npx prisma migrate deploy

# Rollback (careful!)
npx prisma migrate reset
```

### Debugging Tips

**Backend**:
```bash
# Check logs
tail -f apps/api/logs/combined-*.log

# Prisma query logging
# Set in schema.prisma: log: ["query", "info", "warn", "error"]

# Enable debug mode
DEBUG=* npm run dev
```

**Frontend**:
```bash
# Check browser console
# React Developer Tools
# Network tab for API calls

# Enable verbose logging
console.log('Debug:', variable);
```

## Troubleshooting

### "Connection to database failed"

1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql -U paperless_user -d paperless_exam`
4. Check firewall rules

### "Redis connection failed"

1. Check Redis is running: `redis-cli ping`
2. Verify REDIS_HOST and REDIS_PORT
3. Check password if configured

### "Permission denied" errors

1. Check user's roles: `GET /api/v1/auth/me`
2. Verify permission exists in database
3. Check role_permissions table
4. Ensure user has correct role assignment

### "Token expired"

1. Access tokens expire after 15 minutes (by design)
2. Frontend should auto-refresh using refresh token
3. If refresh fails, user must login again
4. Check refresh token in database (not revoked)

### "Port already in use"

```bash
# Find process
lsof -i :5000  # or :3000

# Kill process
kill -9 <PID>
```

## Next Steps

### Phase 2: Academic Structure Management

Start implementing:
1. University CRUD operations (Super Admin)
2. School/Department management
3. Programme/Course setup
4. User-role assignment UI

See [README.md](README.md) for complete roadmap.

### Learning Resources

- **Prisma**: https://www.prisma.io/docs
- **Next.js**: https://nextjs.org/docs
- **Express.js**: https://expressjs.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Shadcn/ui**: https://ui.shadcn.com/

### Getting Help

1. Check documentation in `docs/` folder
2. Review API documentation: `API_DOCS.md`
3. Search existing issues on GitHub
4. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages
   - Environment details

---

**Happy Coding!** 🚀

If you have questions or need clarification, don't hesitate to ask.
