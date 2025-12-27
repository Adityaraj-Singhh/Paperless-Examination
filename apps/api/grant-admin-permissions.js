"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const shared_1 = require("@paperless/shared");
const prisma = new client_1.PrismaClient();
async function main() {
    const universityId = '3f9b941b-e0a2-4d6f-a58c-2f39e8ae410f';
    console.log('🔧 Granting ALL permissions to UNIVERSITY_ADMIN role...\n');
    // Get UNIVERSITY_ADMIN role
    const adminRole = await prisma.role.findUnique({
        where: {
            universityId_name: {
                universityId,
                name: shared_1.UserRole.UNIVERSITY_ADMIN,
            },
        },
    });
    if (!adminRole) {
        console.error('❌ UNIVERSITY_ADMIN role not found!');
        console.log('Please run: npm run create-admin first');
        return;
    }
    console.log(`✅ Found UNIVERSITY_ADMIN role (ID: ${adminRole.id})`);
    // ALL PERMISSIONS - UNIVERSITY_ADMIN should have everything
    const allPermissions = Object.values(shared_1.Permission);
    console.log(`\n📋 Step 1: Ensuring all ${allPermissions.length} permissions exist in database...`);
    // First, ensure all permissions exist in the Permission table
    for (const permissionName of allPermissions) {
        await prisma.permission.upsert({
            where: { name: permissionName },
            update: {},
            create: {
                name: permissionName,
                description: `Permission to ${permissionName.toLowerCase().replace(/_/g, ' ')}`,
                category: permissionName.split('_')[1] || 'GENERAL',
            },
        });
    }
    console.log(`✅ All permissions exist in database`);
    console.log(`\n📋 Step 2: Granting permissions to UNIVERSITY_ADMIN role...`);
    let granted = 0;
    // Now assign all permissions to the UNIVERSITY_ADMIN role
    for (const permissionName of allPermissions) {
        // Get the permission ID
        const permission = await prisma.permission.findUnique({
            where: { name: permissionName },
        });
        if (!permission) {
            console.error(`❌ Permission not found: ${permissionName}`);
            continue;
        }
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
        granted++;
        process.stdout.write('.');
    }
    console.log(`\n\n✅ SUCCESS!`);
    console.log(`   Granted: ${granted} permissions`);
    console.log(`   Total: ${allPermissions.length} permissions`);
    console.log(`\n🎉 UNIVERSITY_ADMIN now has ALL permissions!`);
    console.log(`\n⚠️  IMPORTANT: You must LOG OUT and LOG BACK IN for changes to take effect!`);
    console.log(`   The JWT token is created at login time and includes permissions.`);
}
main()
    .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=grant-admin-permissions.js.map