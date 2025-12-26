import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUniversity() {
  try {
    const university = await prisma.university.create({
      data: {
        name: 'Test University',
        code: 'TU001',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        isActive: true,
      },
    });

    console.log('✅ University created successfully!');
    console.log('University ID:', university.id);
    console.log('University Name:', university.name);
    console.log('\nUse this ID when registering a user.');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating university:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createUniversity();
