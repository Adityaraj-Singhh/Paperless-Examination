"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const auth_1 = require("./src/utils/auth");
const shared_1 = require("@paperless/shared");
const prisma = new client_1.PrismaClient();
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
                name: shared_1.UserRole.SUPER_ADMIN,
            },
        },
        update: {},
        create: {
            universityId,
            name: shared_1.UserRole.SUPER_ADMIN,
            description: 'Super Administrator with full system access - can create universities and admins',
            isSystem: true,
        },
    });
    console.log(`✅ SUPER_ADMIN role ready (ID: ${adminRole.id})`);
    // Define all necessary permissions for SUPER_ADMIN
    const adminPermissions = [
        // University management (SUPER_ADMIN only)
        shared_1.Permission.CREATE_UNIVERSITY,
        shared_1.Permission.UPDATE_UNIVERSITY,
        shared_1.Permission.DELETE_UNIVERSITY,
        shared_1.Permission.VIEW_UNIVERSITY,
        // User management (create admins)
        shared_1.Permission.CREATE_USER,
        shared_1.Permission.UPDATE_USER,
        shared_1.Permission.DELETE_USER,
        shared_1.Permission.VIEW_USER,
        shared_1.Permission.ASSIGN_ROLE,
        // School permissions
        shared_1.Permission.CREATE_SCHOOL,
        shared_1.Permission.VIEW_SCHOOL,
        shared_1.Permission.UPDATE_SCHOOL,
        shared_1.Permission.DELETE_SCHOOL,
        // Department permissions
        shared_1.Permission.CREATE_DEPARTMENT,
        shared_1.Permission.VIEW_DEPARTMENT,
        shared_1.Permission.UPDATE_DEPARTMENT,
        shared_1.Permission.DELETE_DEPARTMENT,
        // Programme permissions
        shared_1.Permission.CREATE_PROGRAMME,
        shared_1.Permission.VIEW_PROGRAMME,
        shared_1.Permission.UPDATE_PROGRAMME,
        shared_1.Permission.DELETE_PROGRAMME,
        // Course permissions
        shared_1.Permission.CREATE_COURSE,
        shared_1.Permission.VIEW_COURSE,
        shared_1.Permission.UPDATE_COURSE,
        shared_1.Permission.DELETE_COURSE,
        // Audit
        shared_1.Permission.VIEW_AUDIT_LOGS,
        shared_1.Permission.GENERATE_REPORTS,
        shared_1.Permission.VIEW_ANALYTICS,
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
    const hashedPassword = await (0, auth_1.hashPassword)('SuperAdmin@123');
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
//# sourceMappingURL=create-admin.js.map