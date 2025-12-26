import { PrismaClient } from '@prisma/client';
import { hashPassword } from './src/utils/auth';
import { UserRole } from '@paperless/shared';

const prisma = new PrismaClient();

async function main() {
  // Use the existing test university
  const universityId = '3f9b941b-e0a2-4d6f-a58c-2f39e8ae410f';

  console.log('🔧 Creating UNIVERSITY_ADMIN role and user...\n');

  // Create/get UNIVERSITY_ADMIN role
  const adminRole = await prisma.role.upsert({
    where: {
      universityId_name: {
        universityId,
        name: UserRole.UNIVERSITY_ADMIN,
      },
    },
    update: {},
    create: {
      universityId,
      name: UserRole.UNIVERSITY_ADMIN,
      description: 'University Administrator with full permissions',
      isSystem: true,
    },
  });

  console.log(`✅ UNIVERSITY_ADMIN role ready (ID: ${adminRole.id})`);

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@test.com' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists!');
    console.log('Email: admin@test.com');
    console.log('If you forgot the password, please delete this user from database first.\n');
    return;
  }

  // Create admin user
  const hashedPassword = await hashPassword('Admin@123');

  await prisma.user.create({
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

  console.log('\n✅ Admin user created successfully!');
  console.log('═══════════════════════════════════════');
  console.log('Email:    admin@test.com');
  console.log('Password: Admin@123');
  console.log('Role:     UNIVERSITY_ADMIN');
  console.log('═══════════════════════════════════════');
  console.log('\nYou can now login with these credentials to:');
  console.log('- Create and manage schools');
  console.log('- Create and manage departments');
  console.log('- Create and manage programmes');
  console.log('- Create and manage courses');
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
