# Phase 2 API Testing Guide

## Prerequisites
1. API server running on `http://localhost:5000`
2. Valid JWT access token (obtain by logging in)
3. User with appropriate permissions (STUDENT role has limited access)

## Authentication
All requests require the `Authorization` header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Quick Test Sequence

### 1. Test Schools (Read-Only for Students)

**Get All Schools**
```http
GET http://localhost:5000/api/v1/schools
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Schools retrieved successfully",
  "data": []
}
```

### 2. Create Test School (Requires CREATE_SCHOOL Permission)

**Create School**
```http
POST http://localhost:5000/api/v1/schools
Content-Type: application/json

{
  "name": "School of Computer Science",
  "code": "SCS01",
  "description": "Technology and computing programs"
}
```

**Expected Response (403 Forbidden for STUDENT):**
```json
{
  "success": false,
  "message": "You don't have permission to perform this action"
}
```

### 3. Get All Departments

**Get Departments**
```http
GET http://localhost:5000/api/v1/departments
```

### 4. Get All Programmes

**Get Programmes**
```http
GET http://localhost:5000/api/v1/programmes
```

### 5. Get All Courses

**Get Courses**
```http
GET http://localhost:5000/api/v1/courses
```

## Creating Test Data Hierarchy

To create a complete academic structure, you need a user with appropriate permissions. Here's the order:

### Step 1: Create School
```http
POST http://localhost:5000/api/v1/schools
Content-Type: application/json

{
  "name": "School of Engineering",
  "code": "SOE",
  "description": "Engineering and technology programs"
}
```

### Step 2: Create Department (using schoolId from Step 1)
```http
POST http://localhost:5000/api/v1/departments
Content-Type: application/json

{
  "name": "Computer Science Department",
  "code": "CS",
  "schoolId": "SCHOOL_ID_FROM_STEP_1",
  "description": "Computer science and software engineering"
}
```

### Step 3: Create Programme (using departmentId from Step 2)
```http
POST http://localhost:5000/api/v1/programmes
Content-Type: application/json

{
  "name": "Bachelor of Computer Science",
  "code": "BCS",
  "departmentId": "DEPARTMENT_ID_FROM_STEP_2",
  "duration": 4,
  "description": "Four-year undergraduate program"
}
```

### Step 4: Create Course (using programmeId from Step 3)
```http
POST http://localhost:5000/api/v1/courses
Content-Type: application/json

{
  "name": "Data Structures and Algorithms",
  "code": "CS201",
  "programmeId": "PROGRAMME_ID_FROM_STEP_3",
  "credits": 4,
  "semester": 3,
  "description": "Core programming course"
}
```

## Testing Validation

### Invalid Code (too short)
```http
POST http://localhost:5000/api/v1/schools
Content-Type: application/json

{
  "name": "Test School",
  "code": "A"
}
```
**Expected: 400 Bad Request** - Code must be 2-20 characters

### Duplicate Code
```http
POST http://localhost:5000/api/v1/schools
Content-Type: application/json

{
  "name": "Another School",
  "code": "SOE"
}
```
**Expected: 409 Conflict** - Code already exists

### Missing Required Field
```http
POST http://localhost:5000/api/v1/schools
Content-Type: application/json

{
  "code": "TEST"
}
```
**Expected: 400 Bad Request** - Name is required

## Testing Update Operations

### Update School
```http
PUT http://localhost:5000/api/v1/schools/{SCHOOL_ID}
Content-Type: application/json

{
  "name": "Updated School Name",
  "description": "Updated description"
}
```

### Toggle Status
```http
PATCH http://localhost:5000/api/v1/schools/{SCHOOL_ID}/toggle-status
```

## Testing Delete Operations

### Delete Course (should work if no exams)
```http
DELETE http://localhost:5000/api/v1/courses/{COURSE_ID}
```

### Delete Programme (should fail if courses exist)
```http
DELETE http://localhost:5000/api/v1/programmes/{PROGRAMME_ID}
```
**Expected: 400 Bad Request** - Cannot delete programme with existing courses

## Testing Filters

### Get Departments for Specific School
```http
GET http://localhost:5000/api/v1/departments?schoolId={SCHOOL_ID}
```

### Get Programmes for Specific Department
```http
GET http://localhost:5000/api/v1/programmes?departmentId={DEPARTMENT_ID}
```

### Get Courses for Specific Programme
```http
GET http://localhost:5000/api/v1/courses?programmeId={PROGRAMME_ID}
```

## VS Code REST Client Extension

If using REST Client extension in VS Code, create a file `api-tests.http`:

```http
### Variables
@baseUrl = http://localhost:5000/api/v1
@token = YOUR_ACCESS_TOKEN_HERE

### Login
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "raj@gmail.com",
  "password": "your_password"
}

### Get Schools
GET {{baseUrl}}/schools
Authorization: Bearer {{token}}

### Create School
POST {{baseUrl}}/schools
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "School of Business",
  "code": "SOB",
  "description": "Business and management programs"
}

### Get Departments
GET {{baseUrl}}/departments
Authorization: Bearer {{token}}

### Create Department
POST {{baseUrl}}/departments
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "Marketing Department",
  "code": "MKT",
  "schoolId": "YOUR_SCHOOL_ID",
  "description": "Marketing and advertising"
}
```

## Expected Permission Errors

With STUDENT role, you should get 403 errors for:
- POST /schools (CREATE_SCHOOL required)
- PUT /schools/:id (UPDATE_SCHOOL required)
- DELETE /schools/:id (DELETE_SCHOOL required)
- Similar for departments, programmes, courses

To test create/update/delete operations, you need to:
1. Create a user with higher privileges (ADMIN, DEAN, HOD)
2. Or grant specific permissions to the STUDENT role

## Creating Admin User Script

Create `apps/api/create-admin.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { hashPassword } from './src/utils/auth';
import { UserRole } from '@paperless/shared';

const prisma = new PrismaClient();

async function main() {
  const universityId = '3f9b941b-e0a2-4d6f-a58c-2f39e8ae410f'; // Your university ID

  // Create ADMIN role
  const adminRole = await prisma.role.upsert({
    where: {
      universityId_name: {
        universityId,
        name: UserRole.ADMIN,
      },
    },
    update: {},
    create: {
      universityId,
      name: UserRole.ADMIN,
      description: 'University Administrator',
      isSystem: true,
    },
  });

  // Create admin user
  const hashedPassword = await hashPassword('Admin@123');
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      universityId,
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  console.log('✅ Admin user created!');
  console.log('Email: admin@test.com');
  console.log('Password: Admin@123');
  console.log('Role: ADMIN');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run: `npx ts-node apps/api/create-admin.ts`

Then login as admin to test create/update/delete operations!
