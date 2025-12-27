# SUPER_ADMIN & ADMIN API Endpoints

## Authentication

**Login Credentials:**
- SUPER_ADMIN: `superadmin@system.com` / `SuperAdmin@123`

### POST /api/v1/auth/login
Login to get access token

**Request:**
```json
{
  "email": "superadmin@system.com",
  "password": "SuperAdmin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## SUPER_ADMIN Endpoints

### 1. Create University
**POST** `/api/v1/universities`
- **Permission Required:** CREATE_UNIVERSITY
- **Access:** SUPER_ADMIN only

**Request:**
```json
{
  "name": "Harvard University",
  "code": "HARVARD",
  "email": "admin@harvard.edu",
  "phone": "+1-617-495-1000",
  "address": "Massachusetts Hall",
  "city": "Cambridge",
  "state": "Massachusetts",
  "country": "USA",
  "website": "https://www.harvard.edu",
  "logo": "https://example.com/logo.png"
}
```

**Response:**
```json
{
  "success": true,
  "message": "University created successfully",
  "data": {
    "id": "uuid",
    "name": "Harvard University",
    "code": "HARVARD",
    ...
  }
}
```

### 2. Get All Universities
**GET** `/api/v1/universities`
- **Permission Required:** VIEW_UNIVERSITY
- **Access:** SUPER_ADMIN, ADMIN

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Harvard University",
      "code": "HARVARD",
      "_count": {
        "users": 150,
        "schools": 12
      }
    }
  ]
}
```

### 3. Get University by ID
**GET** `/api/v1/universities/:id`
- **Permission Required:** VIEW_UNIVERSITY
- **Access:** SUPER_ADMIN, ADMIN

### 4. Update University
**PATCH** `/api/v1/universities/:id`
- **Permission Required:** UPDATE_UNIVERSITY
- **Access:** SUPER_ADMIN only

### 5. Delete University
**DELETE** `/api/v1/universities/:id`
- **Permission Required:** DELETE_UNIVERSITY
- **Access:** SUPER_ADMIN only

### 6. Create Admin User
**POST** `/api/v1/users/admin`
- **Permission Required:** CREATE_USER
- **Access:** SUPER_ADMIN only

**Request:**
```json
{
  "email": "admin@harvard.edu",
  "password": "Admin@123",
  "firstName": "John",
  "lastName": "Doe",
  "universityId": "uuid-of-university",
  "phone": "+1-555-0100"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "id": "uuid",
    "email": "admin@harvard.edu",
    "firstName": "John",
    "lastName": "Doe",
    "universityId": "uuid",
    "university": {
      "id": "uuid",
      "name": "Harvard University",
      "code": "HARVARD"
    },
    "userRoles": [
      {
        "role": {
          "name": "ADMIN",
          "description": "University Administrator"
        }
      }
    ]
  }
}
```

### 7. Get All Users (System-wide)
**GET** `/api/v1/users`
- **Permission Required:** VIEW_USER
- **Access:** SUPER_ADMIN (sees all users), ADMIN (sees university users only)

---

## ADMIN Endpoints

### 1. Create Teacher
**POST** `/api/v1/users/teacher`
- **Permission Required:** CREATE_USER
- **Access:** ADMIN

**Request:**
```json
{
  "email": "teacher@harvard.edu",
  "password": "Teacher@123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-555-0200"
}
```

### 2. Create Student
**POST** `/api/v1/users/student`
- **Permission Required:** CREATE_USER
- **Access:** ADMIN

**Request:**
```json
{
  "email": "student@harvard.edu",
  "password": "Student@123",
  "firstName": "Alice",
  "lastName": "Johnson",
  "studentId": "H2024001",
  "phone": "+1-555-0300"
}
```

### 3. Create School
**POST** `/api/v1/schools`
- **Permission Required:** CREATE_SCHOOL
- **Access:** ADMIN

**Request:**
```json
{
  "name": "School of Engineering",
  "code": "ENG",
  "description": "Engineering school"
}
```

### 4. Create Department
**POST** `/api/v1/departments`
- **Permission Required:** CREATE_DEPARTMENT
- **Access:** ADMIN

**Request:**
```json
{
  "name": "Computer Science",
  "code": "CS",
  "schoolId": "uuid-of-school",
  "description": "Computer Science Department"
}
```

### 5. Create Programme
**POST** `/api/v1/programmes`
- **Permission Required:** CREATE_PROGRAMME
- **Access:** ADMIN

**Request:**
```json
{
  "name": "Bachelor of Science in Computer Science",
  "code": "BSCS",
  "departmentId": "uuid-of-department",
  "durationYears": 4,
  "description": "4-year CS program"
}
```

### 6. Create Course
**POST** `/api/v1/courses`
- **Permission Required:** CREATE_COURSE
- **Access:** ADMIN

**Request:**
```json
{
  "name": "Data Structures",
  "code": "CS201",
  "programmeId": "uuid-of-programme",
  "credits": 3,
  "description": "Introduction to data structures"
}
```

---

## Role Hierarchy

```
SUPER_ADMIN
├── Create Universities
├── Create Admins (assign to universities)
├── View all system data
└── Full system access

ADMIN (University Level)
├── Manage Schools
├── Manage Departments
├── Manage Programmes
├── Manage Courses
├── Create Teachers
├── Create Students
├── Manage Exams
└── View Reports

TEACHER
├── Create Questions
├── Generate Papers
├── Conduct Exams
├── Evaluate Answers
└── View Results

STUDENT
├── Take Exams
├── View Results
└── Request Scrutiny
```

---

## Testing Flow

1. **Login as SUPER_ADMIN**
   ```bash
   POST /api/v1/auth/login
   {
     "email": "superadmin@system.com",
     "password": "SuperAdmin@123"
   }
   ```

2. **Create University**
   ```bash
   POST /api/v1/universities
   Headers: { "Authorization": "Bearer <token>" }
   ```

3. **Create Admin for University**
   ```bash
   POST /api/v1/users/admin
   Headers: { "Authorization": "Bearer <token>" }
   ```

4. **Login as Admin**
   ```bash
   POST /api/v1/auth/login
   {
     "email": "admin@harvard.edu",
     "password": "Admin@123"
   }
   ```

5. **Create School, Department, Programme, Course**
   ```bash
   POST /api/v1/schools
   POST /api/v1/departments
   POST /api/v1/programmes
   POST /api/v1/courses
   ```

6. **Create Teachers and Students**
   ```bash
   POST /api/v1/users/teacher
   POST /api/v1/users/student
   ```

---

## Headers Required

All authenticated requests require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
