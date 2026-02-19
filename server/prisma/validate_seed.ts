
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const opCount = await prisma.operator.count();
    const servCount = await prisma.service.count();
    console.log(`Operators: ${opCount}`);
    console.log(`Services: ${servCount}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
