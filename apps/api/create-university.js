"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createUniversity() {
    try {
        const university = await prisma.university.upsert({
            where: { code: 'TU001' },
            update: {},
            create: {
                name: 'Test University',
                code: 'TU001',
                address: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                country: 'India',
                isActive: true,
            },
        });
        console.log('✅ University ready!');
        console.log('University ID:', university.id);
        console.log('University Name:', university.name);
        console.log('\nUse this ID when registering a user.');
        await prisma.$disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('Error creating university:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}
createUniversity();
//# sourceMappingURL=create-university.js.map