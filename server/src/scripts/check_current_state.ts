import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Database State...');

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

    console.log(`Found ${events.length} events.`);

    for (const event of events) {
        console.log(`Event: ${event.name} | ID: ${event.id}`);
        console.log(`  Transactions: ${event._count.transactions}`);
        console.log(`  Requisitions: ${event._count.requisitions}`);
    }

    if (events.length === 0) {
        console.log('Database is clean (no events).');
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
