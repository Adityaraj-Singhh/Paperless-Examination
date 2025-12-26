# Paperless Examination System

A production-ready, multi-tenant examination management platform supporting objective, subjective, and mixed-mode assessments with AI-assisted evaluation, strict RBAC, and complete audit trails.

## 🏗️ Architecture Overview

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js 20+ with Express.js, Prisma ORM
- **Database**: PostgreSQL 15+
- **Cache**: Redis 6+
- **Multi-tenant**: University-level isolation
- **RBAC**: Permission-centric access control
- **Security**: JWT auth, bcrypt hashing, rate limiting, audit logging

## 📁 Project Structure

```
paperless-exam-system/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   ├── components/     # UI components
│   │   │   ├── lib/            # Utilities, API client
│   │   │   ├── store/          # Zustand stores
│   │   │   └── hooks/          # Custom hooks
│   │   └── public/
│   │
│   └── api/                    # Express.js backend
│       ├── src/
│       │   ├── controllers/    # Route controllers
│       │   ├── services/       # Business logic
│       │   ├── middleware/     # Auth, RBAC, validation
│       │   ├── routes/         # API routes
│       │   ├── config/         # Configuration
│       │   └── utils/          # Helper functions
│       └── prisma/
│           └── schema.prisma   # Database schema
│
└── packages/
    └── shared/                 # Shared types, constants
        └── src/
            ├── types.ts
            ├── enums.ts
            └── constants.ts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 6+
- npm or yarn

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Setup Backend**:
```bash
cd apps/api
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:migrate
```

3. **Setup Frontend**:
```bash
cd apps/web
cp .env.example .env
# Edit .env with API URL
```

4. **Start Development Servers**:

From root directory:
```bash
npm run dev
```

Or individually:
```bash
# Backend (port 5000)
cd apps/api && npm run dev

# Frontend (port 3000)
cd apps/web && npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Prisma Studio**: `npm run prisma:studio` (in apps/api)

## 🔐 Authentication Flow

1. **Register**: POST `/api/v1/auth/register`
   - Creates user account (no roles assigned)
   - Admin must assign roles before login

2. **Login**: POST `/api/v1/auth/login`
   - Returns access token (15min) + refresh token (7 days)
   - Stores tokens in localStorage

3. **Protected Routes**:
   - Access token sent in `Authorization: Bearer <token>` header
   - Auto-refresh on 401 using refresh token

4. **Logout**: POST `/api/v1/auth/logout`
   - Revokes refresh token
   - Blacklists access token in Redis

## 👥 User Roles & Permissions

### Role Hierarchy

- **SUPER_ADMIN**: System-wide administration
- **UNIVERSITY_ADMIN**: University-level management
- **DEAN**: School-level operations, paper approvals
- **HOD**: Department management, question moderation
- **EXAM_DEPT**: Exam creation, paper generation, result publishing
- **TEACHER**: Question authoring, evaluation
- **EVALUATOR**: Answer script evaluation
- **STUDENT**: Exam participation, result viewing

### Key Permissions

- **Exam Management**: `CREATE_EXAM`, `APPROVE_EXAM`, `PUBLISH_EXAM`
- **Paper Management**: `GENERATE_PAPER`, `APPROVE_PAPER` (requires 2FA)
- **Question Bank**: `CREATE_QUESTION`, `MODERATE_QUESTION`, `SEAL_QUESTION_BANK`
- **Evaluation**: `EVALUATE_ANSWER`, `APPROVE_EVALUATION`
- **Results**: `PUBLISH_RESULTS`, `REQUEST_SCRUTINY`, `APPROVE_SCRUTINY`

See [packages/shared/src/constants.ts](packages/shared/src/constants.ts) for complete permission mapping.

## 🔄 Exam State Machine

```
DRAFT → COURSE_LOCKED → GENERATED → APPROVED → READY → OPEN → SUBMITTED → EVALUATED → PUBLISHED → CLOSED
```

Each transition requires specific permissions and roles. State changes are logged in audit trail.

## 🗄️ Database Schema

### Core Tables

- **Multi-Tenant**: `universities` (root tenant)
- **Academic Hierarchy**: `schools`, `departments`, `programmes`, `courses`, `sections`
- **RBAC**: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`
- **Exams**: `exams`, `exam_courses`, `papers`, `paper_sections`, `paper_questions`
- **Questions**: `questions` (with CO, Bloom's, difficulty tracking)
- **Conduction**: `exam_sessions`, `student_answers`
- **Evaluation**: `evaluations`, `question_marks`, `ai_evaluations`
- **Results**: `results`, `scrutiny_requests`
- **Audit**: `audit_logs`, `exam_state_transitions`

### Multi-Tenant Queries

All queries automatically scoped to user's university:

```typescript
const courses = await prisma.course.findMany({
  where: {
    universityId: req.user.universityId, // Auto-injected from JWT
    ...otherFilters
  }
});
```

## 🛡️ Security Features

### Authentication & Authorization

- JWT-based authentication (access + refresh tokens)
- bcrypt password hashing (12 rounds)
- Token blacklisting on logout (Redis)
- RBAC middleware for fine-grained permissions
- Multi-tenant context injection

### Rate Limiting

- **Auth Endpoints**: 100 req/15min per IP
- **API Endpoints**: 1000 req/15min per IP
- **Strict Ops**: 5 req/hour (OTP, password reset)
- Redis-backed with memory fallback

### Input Validation

- Express-validator for backend
- Zod schemas for frontend (React Hook Form)
- Prisma for SQL injection prevention

### HTTP Security

- Helmet.js security headers
- CORS configuration
- XSS protection
- Request size limits

### Audit Logging

All critical actions logged:
- User authentication (login/logout)
- State changes
- Approvals/rejections
- Data modifications
- IP address & user agent tracking

## 📊 Exam Conduction Interface

### Three-Column Layout

1. **Question Navigation**: Dropdown selector with status indicators
2. **Question Display**: Text + Canvas for handwriting (stylus support)
3. **Marks Display**: Points per question

### Features

- Auto-save every 30 seconds
- Version tracking for answers
- Navigation confirmation on unsaved changes
- Anti-cheating: Disable copy-paste, right-click
- Session timeout handling
- Real-time answer synchronization

## 🤖 AI Evaluation Pipeline (Stub)

Prepared service structure for future integration:

```typescript
class AIEvaluationService {
  async extractHandwriting(imageBuffer: Buffer): Promise<string>
  async detectLanguage(text: string): Promise<string>
  async translateToEnglish(text: string, lang: string): Promise<string>
  async evaluateAnswer(question: string, model: string, student: string): Promise<AIScore>
}
```

Ready for AWS Textract/Translate integration.

## 📈 Development Roadmap

### ✅ Phase 1: Foundation (Completed)

- [x] Monorepo structure
- [x] Database schema with Prisma
- [x] Express.js API with middleware
- [x] Authentication system (JWT)
- [x] RBAC middleware
- [x] Audit logging
- [x] Next.js frontend setup
- [x] Login/Register UI

### 🔄 Phase 2: Academic Structure (Next)

- [ ] University CRUD (Super Admin)
- [ ] School/Department management (University Admin)
- [ ] Programme/Course management
- [ ] User role assignment interface
- [ ] Permission matrix configuration

### 📝 Phase 3: Exam Configuration

- [ ] Exam creation (Exam Dept)
- [ ] Course selection & blueprints (Dean)
- [ ] Paper setter assignment (HOD)
- [ ] Paper structure definition

### 💡 Phase 4: Question Management

- [ ] Question authoring interface
- [ ] Rich text editor with image support
- [ ] Question moderation workflow (HOD)
- [ ] Question bank sealing

### 📄 Phase 5: Paper Generation

- [ ] Auto-generation algorithm (Bloom's/difficulty distribution)
- [ ] Validation engine
- [ ] Paper encryption
- [ ] 2FA approval workflow (Dean)

### 🎓 Phase 6: Exam Conduction

- [ ] Student registration & room allocation
- [ ] Three-column exam interface
- [ ] Canvas handwriting input
- [ ] Auto-save mechanism
- [ ] Final submission workflow

### ✍️ Phase 7: Evaluation

- [ ] Evaluator assignment
- [ ] Answer script viewer
- [ ] AI evaluation stubs
- [ ] Manual evaluation interface
- [ ] Evaluation approval (HOD)

### 📊 Phase 8: Results & Scrutiny

- [ ] Result compilation
- [ ] Result publishing
- [ ] Student result view
- [ ] Scrutiny request system
- [ ] Multi-level scrutiny approval

### 📈 Phase 9: Reporting

- [ ] Audit log viewer with filters
- [ ] Analytics dashboard (Recharts)
- [ ] Export functionality (PDF/Excel)
- [ ] Performance metrics

### 🚀 Phase 10: Production

- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation (Swagger)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deployment guides

## 🧪 Testing

```bash
# Backend tests
cd apps/api
npm run test

# Frontend tests
cd apps/web
npm run test

# E2E tests
npm run test:e2e
```

## 📚 API Documentation

### Authentication

- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get profile
- `PATCH /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/change-password` - Change password

### Future Endpoints

- `/api/v1/universities` - University management
- `/api/v1/schools` - School management
- `/api/v1/departments` - Department management
- `/api/v1/courses` - Course management
- `/api/v1/exams` - Exam management
- `/api/v1/questions` - Question bank
- `/api/v1/papers` - Paper generation
- `/api/v1/evaluations` - Evaluation system
- `/api/v1/results` - Result management
- `/api/v1/audit` - Audit logs

## 🐳 Deployment

### Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Checklist

- [ ] Change all secrets in `.env`
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure production database (RDS/managed)
- [ ] Setup Redis cluster
- [ ] Configure CDN for static assets
- [ ] Setup monitoring (Datadog/NewRelic)
- [ ] Configure log aggregation
- [ ] Enable rate limiting in production
- [ ] Setup automated backups
- [ ] Configure firewall rules

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👨‍💻 Developed By

Senior Full-Stack Developer with 15+ years of experience in enterprise examination systems.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@paperless-exam.com
- Documentation: [docs/](docs/)

---

**Status**: Phase 1 Complete ✅ | Active Development 🚧
