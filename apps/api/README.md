# Paperless Examination System - Backend API

## Setup Instructions

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 6+
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd apps/api
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - DATABASE_URL
   - JWT secrets
   - Redis configuration

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. (Optional) Seed initial data:
```bash
npm run prisma:seed
```

### Development

Start development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Production

Build the project:
```bash
npm run build
```

Start production server:
```bash
npm start
```

### Database Management

- **Prisma Studio**: Visual database editor
```bash
npm run prisma:studio
```

- **Create Migration**:
```bash
npx prisma migrate dev --name migration_name
```

- **Reset Database** (development only):
```bash
npx prisma migrate reset
```

### API Documentation

The API follows RESTful conventions and is versioned at `/api/v1/`

#### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user profile
- `PATCH /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/change-password` - Change password

#### Health Check

- `GET /health` - Server health status

### Testing

```bash
npm run test
```

### Security Features

- JWT-based authentication
- bcrypt password hashing (12 rounds)
- Rate limiting (Redis-backed)
- Helmet security headers
- CORS configuration
- Input validation (express-validator)
- SQL injection prevention (Prisma)
- Token blacklisting on logout

### Multi-Tenant Architecture

All queries are automatically scoped to the user's university through middleware:

```typescript
const courses = await prisma.course.findMany({
  where: {
    universityId: req.user.universityId, // Auto-injected
    ...otherFilters
  }
});
```

### RBAC System

Permissions are checked at middleware level:

```typescript
router.post('/exams',
  authenticate,
  requirePermission(Permission.CREATE_EXAM),
  examController.create
);
```

### Audit Logging

All critical actions are automatically logged:

```typescript
await AuditService.log({
  universityId,
  userId,
  action: AuditAction.CREATE,
  entityType: 'Exam',
  entityId: exam.id,
  afterState: examData,
  ipAddress,
  userAgent,
});
```

### Error Handling

Custom error class with automatic HTTP status codes:

```typescript
throw new AppError(404, 'Resource not found');
```

### Environment Variables

See `.env.example` for all available configuration options.

### Logging

Winston logger with daily rotation:
- Console output (development)
- File output (production)
- Levels: error, warn, info, http, debug

Logs are stored in `logs/` directory.

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
├── types/           # TypeScript types
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

### Next Steps

1. Implement university/school/department management
2. Build exam configuration system
3. Create question bank management
4. Develop paper generation algorithm
5. Implement exam conduction interface (backend)
6. Build evaluation system with AI stubs
7. Create result publication system
8. Add reporting and analytics

For detailed implementation plan, see the main project README.
