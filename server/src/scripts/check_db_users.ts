import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users in DB:');
        users.forEach(u => {
            console.log(`- ${u.email} (Role: ${u.role})`);
        });

        if (users.length === 0) {
            console.log('No users found in database.');
        }
    } catch (e) {
        console.error('Error connecting to database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
