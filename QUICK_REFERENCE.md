# 🚀 Paperless Exam System - Developer Quick Reference

## Essential Commands

### Development
```bash
# Start all services
npm run dev

# Backend only
cd apps/api && npm run dev

# Frontend only
cd apps/web && npm run dev

# Database GUI
cd apps/api && npm run prisma:studio
```

### Database
```bash
cd apps/api

# Create migration
npx prisma migrate dev --name <name>

# Apply migrations (production)
npx prisma migrate deploy

# Generate Prisma client
npm run prisma:generate

# Reset database (dev only!)
npx prisma migrate reset
```

### Building
```bash
# Build all
npm run build

# Build backend
cd apps/api && npm run build

# Build frontend
cd apps/web && npm run build
```

## Project Structure

```
paperless-exam-system/
├── apps/
│   ├── api/                      # Backend Express.js
│   │   ├── src/
│   │   │   ├── config/          # Database, Redis, Logger
│   │   │   ├── controllers/     # Route handlers
│   │   │   ├── middleware/      # Auth, RBAC, Validation
│   │   │   ├── routes/          # API routes
│   │   │   ├── services/        # Business logic
│   │   │   ├── utils/           # Helpers
│   │   │   ├── app.ts           # Express setup
│   │   │   └── server.ts        # Entry point
│   │   └── prisma/
│   │       └── schema.prisma    # Database schema
│   │
│   └── web/                     # Frontend Next.js
│       ├── src/
│       │   ├── app/             # Pages (App Router)
│       │   ├── components/      # React components
│       │   ├── lib/             # API client, utils
│       │   └── store/           # Zustand state
│       └── public/
│
└── packages/
    └── shared/                  # Shared types
        └── src/
            ├── types.ts         # Interfaces
            ├── enums.ts         # Enums
            └── constants.ts     # Constants
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:3000
ENCRYPTION_KEY=<32-char-key>
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<secret>
```

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register        Register user
POST   /api/v1/auth/login           Login
POST   /api/v1/auth/refresh         Refresh token
POST   /api/v1/auth/logout          Logout
GET    /api/v1/auth/me              Get profile
PATCH  /api/v1/auth/profile         Update profile
POST   /api/v1/auth/change-password Change password
```

### Health
```
GET    /health                      Server health
```

## Common Patterns

### Backend: Create Protected Route

```typescript
// 1. Define validation
export const createValidation = [
  body('name').notEmpty().withMessage('Name required'),
];

// 2. Create controller
export class ResourceController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const resource = await ResourceService.create(
      req.body,
      authReq.user.universityId
    );
    sendSuccess(res, resource, 'Created', 201);
  });
}

// 3. Create route
router.post('/',
  authenticate,
  requirePermission(Permission.CREATE_RESOURCE),
  validate(createValidation),
  ResourceController.create
);

// 4. Add to app.ts
this.app.use('/api/v1/resources', resourceRoutes);
```

### Backend: Query with Multi-Tenant

```typescript
// Always include universityId
const items = await prisma.item.findMany({
  where: {
    universityId: req.user.universityId, // From JWT
    ...otherFilters
  }
});
```

### Backend: Audit Log

```typescript
await AuditService.log({
  universityId: req.user.universityId,
  userId: req.user.userId,
  action: AuditAction.CREATE,
  entityType: 'Resource',
  entityId: resource.id,
  afterState: resource,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
```

### Frontend: API Call with React Query

```typescript
// 1. Add to API client
export const api = {
  resources: {
    create: (data: CreateInput) =>
      apiClient.post<ApiResponse<Resource>>('/resources', data),
  },
};

// 2. Use in component
const { mutate, isLoading } = useMutation({
  mutationFn: api.resources.create,
  onSuccess: () => {
    toast.success('Created!');
    router.push('/resources');
  },
  onError: (error) => {
    toast.error(handleApiError(error));
  },
});
```

### Frontend: Protected Page

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth.store';

export default function ProtectedPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return <div>Protected Content</div>;
}
```

### Frontend: Role-Based UI

```typescript
const { hasRole, hasAnyRole } = useAuth();

// Show only if user has role
{hasRole(UserRole.ADMIN) && (
  <Button>Admin Action</Button>
)}

// Show if user has any of these roles
{hasAnyRole([UserRole.DEAN, UserRole.HOD]) && (
  <Button>Approve</Button>
)}
```

## Database Schema Quick Ref

### Key Tables
- `universities` - Root tenant
- `users` - User accounts
- `roles`, `permissions` - RBAC
- `exams` - Exam events
- `questions` - Question bank
- `papers` - Generated papers
- `exam_sessions` - Student exams
- `evaluations` - Evaluation records
- `results` - Final results
- `audit_logs` - Audit trail

### Important Relationships
```
University
  ├── Schools
  │     └── Departments
  │           └── Programmes
  │                 └── Courses
  │
  ├── Users → UserRoles → Roles → RolePermissions → Permissions
  │
  └── Exams
        ├── ExamCourses
        └── Papers
              ├── PaperSections
              └── PaperQuestions → Questions
```

## User Roles

| Role | Key Permissions |
|------|----------------|
| SUPER_ADMIN | System-wide administration |
| UNIVERSITY_ADMIN | University management |
| DEAN | School operations, paper approvals |
| HOD | Department management, question moderation |
| EXAM_DEPT | Exam creation, paper generation, results |
| TEACHER | Question authoring, evaluation |
| EVALUATOR | Answer script evaluation |
| STUDENT | Exam participation, result viewing |

## Exam State Machine

```
DRAFT → COURSE_LOCKED → GENERATED → APPROVED → READY 
  → OPEN → SUBMITTED → EVALUATED → PUBLISHED → CLOSED
```

## Error Handling

```typescript
// Backend
throw new AppError(404, 'Resource not found');
throw new AppError(403, 'Insufficient permissions');
throw new AppError(400, 'Invalid input');

// Frontend
try {
  const response = await api.resource.get();
} catch (error) {
  const message = handleApiError(error);
  toast.error(message);
}
```

## Security Checklist

- [ ] Use `authenticate` middleware for protected routes
- [ ] Check permissions with `requirePermission()`
- [ ] Always include `universityId` in queries
- [ ] Validate input with express-validator
- [ ] Log actions with AuditService
- [ ] Use `asyncHandler` for async routes
- [ ] Hash passwords with bcrypt
- [ ] Use prepared statements (Prisma)
- [ ] Sanitize user input
- [ ] Rate limit sensitive endpoints

## Testing

```bash
# Backend tests
cd apps/api
npm test

# Frontend tests
cd apps/web
npm test

# E2E tests
npm run test:e2e
```

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL
sudo systemctl status postgresql
psql -U paperless_user -d paperless_exam

# Check DATABASE_URL in .env
```

### Redis Connection Failed
```bash
# Check Redis
redis-cli ping

# Should return: PONG
```

### Port Already in Use
```bash
# Find process
lsof -i :5000

# Kill it
kill -9 <PID>
```

### Token Expired
- Access tokens expire after 15 minutes
- Frontend auto-refreshes using refresh token
- If refresh fails, user must login again

## Quick Links

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health**: http://localhost:5000/health
- **Prisma Studio**: http://localhost:5555

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git add .
git commit -m "Add feature description"

# Push to remote
git push origin feature/feature-name

# Create Pull Request on GitHub
```

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Or with Docker
docker-compose up -d
```

## Need Help?

1. Check documentation in `docs/` folder
2. Review `GETTING_STARTED.md`
3. Check `README.md` for architecture
4. Search existing issues
5. Create new issue with details

---

**Tip**: Keep this file handy while developing! 📌
