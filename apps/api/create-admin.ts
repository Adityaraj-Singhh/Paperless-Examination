import { PrismaClient } from '@prisma/client';
import { hashPassword } from './src/utils/auth';
import { UserRole, Permission } from '@paperless/shared';

const prisma = new PrismaClient();

async function main() {
  const universityId = '3f9b941b-e0a2-4d6f-a58c-2f39e8ae410f';

  console.log('🔧 Setting up SUPER_ADMIN user...\n');

  // Create/get test university
  const university = await prisma.university.upsert({
    where: { id: universityId },
    update: {},
    create: {
      id: universityId,
      name: 'System',
      code: 'SYSTEM',
      country: 'India',
    },
  });

  console.log(`✅ System university ready (ID: ${university.id})`);
  console.log('🔧 Creating SUPER_ADMIN role and user...\n');

  // Create/get SUPER_ADMIN role
  const adminRole = await prisma.role.upsert({
    where: {
      universityId_name: {
        universityId,
        name: UserRole.SUPER_ADMIN,
      },
    },
    update: {},
    create: {
      universityId,
      name: UserRole.SUPER_ADMIN,
      description: 'Super Administrator with full system access - can create universities and admins',
      isSystem: true,
    },
  });

  console.log(`✅ SUPER_ADMIN role ready (ID: ${adminRole.id})`)

  // Define all necessary permissions for SUPER_ADMIN
  const adminPermissions = [
    // University management (SUPER_ADMIN only)
    Permission.CREATE_UNIVERSITY,
    Permission.UPDATE_UNIVERSITY,
    Permission.DELETE_UNIVERSITY,
    Permission.VIEW_UNIVERSITY,
    // User management (create admins)
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.VIEW_USER,
    Permission.ASSIGN_ROLE,
    // School permissions
    Permission.CREATE_SCHOOL,
    Permission.VIEW_SCHOOL,
    Permission.UPDATE_SCHOOL,
    Permission.DELETE_SCHOOL,
    // Department permissions
    Permission.CREATE_DEPARTMENT,
    Permission.VIEW_DEPARTMENT,
    Permission.UPDATE_DEPARTMENT,
    Permission.DELETE_DEPARTMENT,
    // Programme permissions
    Permission.CREATE_PROGRAMME,
    Permission.VIEW_PROGRAMME,
    Permission.UPDATE_PROGRAMME,
    Permission.DELETE_PROGRAMME,
    // Course permissions
    Permission.CREATE_COURSE,
    Permission.VIEW_COURSE,
    Permission.UPDATE_COURSE,
    Permission.DELETE_COURSE,
    // Audit
    Permission.VIEW_AUDIT_LOGS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_ANALYTICS,
  ];

  // First, create all permissions if they don't exist
  console.log('🔧 Ensuring permissions exist...');
  for (const permissionName of adminPermissions) {
    await prisma.permission.upsert({
      where: { name: permissionName },
      update: {},
      create: {
        name: permissionName,
        description: `Permission to ${permissionName.replace(/_/g, ' ').toLowerCase()}`,
      },
    });
  }
  console.log(`✅ Created/verified ${adminPermissions.length} permissions`);

  // Now assign permissions to the role
  console.log('🔧 Assigning permissions to SUPER_ADMIN role...');
  for (const permissionName of adminPermissions) {
    // Get the permission ID
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log(`✅ Assigned ${adminPermissions.length} permissions to SUPER_ADMIN role`);

  // Check if super admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'superadmin@system.com' },
  });

  if (existingAdmin) {
    console.log('⚠️  Super Admin user already exists!');
    console.log('Email: superadmin@system.com');
    console.log('If you forgot the password, please delete this user from database first.\n');
    return;
  }

  // Create super admin user
  const hashedPassword = await hashPassword('SuperAdmin@123');

  await prisma.user.create({
    data: {
      email: 'superadmin@system.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      universityId,
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  console.log('\n✅ Super Admin user created successfully!');
  console.log('═══════════════════════════════════════');
  console.log('Email:    superadmin@system.com');
  console.log('Password: SuperAdmin@123');
  console.log('Role:     SUPER_ADMIN');
  console.log('═══════════════════════════════════════');
  console.log('\nYou can now login with these credentials to:');
  console.log('- Create universities');
  console.log('- Create and assign admins to universities');
  console.log('- Manage the entire system');
  console.log('\nLogin at: http://localhost:3000/login\n');
}

main()
  .catch((error) => {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
