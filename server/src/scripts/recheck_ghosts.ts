import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Re-analyzing Events for "Ghost" Transactions...');

    const events = await prisma.event.findMany({
        include: {
            _count: {
                select: {
                    transactions: true,
                    requisitions: true
                }
            }
        }
    });

    console.log(`Found ${events.length} total events.`);

    for (const event of events) {
        console.log(`Event: ${event.name} | ID: ${event.id}`);
        console.log(`  Transactions: ${event._count.transactions}`);
        console.log(`  Requisitions: ${event._count.requisitions}`);

        if (event._count.transactions > 0 && event._count.requisitions === 0) {
            console.log(`  >>> PROBLEM CONFIRMED: Transactions exist but NO Requisitions.`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
