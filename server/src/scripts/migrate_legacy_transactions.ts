
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting migration of legacy transactions...');

    try {
        // 1. Get all events
        const events = await prisma.event.findMany({
            include: {
                transactions: {
                    where: {
                        requisitionId: null
                    }
                }
            }
        });

        console.log(`Found ${events.length} events.`);

        for (const event of events) {
            const legacyTransactions = event.transactions;

            if (legacyTransactions.length === 0) {
                console.log(`Event ${event.name} (ID: ${event.id}) has no legacy transactions.`);
                continue;
            }

            console.log(`Event ${event.name} has ${legacyTransactions.length} legacy transactions. Creating requisition...`);

            // 2. Create a new Requisition for this event
            const requisition = await prisma.requisition.create({
                data: {
                    eventId: event.id,
                }
            });

            console.log(`Created Requisition #${requisition.number} (ID: ${requisition.id}) for Event ${event.name}.`);

            // 3. Update transactions
            const updateResult = await prisma.transaction.updateMany({
                where: {
                    id: {
                        in: legacyTransactions.map(t => t.id)
                    }
                },
                data: {
                    requisitionId: requisition.id,
                    quantity: 1 // Ensure quantity is at least 1 for legacy items
                }
            });

            console.log(`Updated ${updateResult.count} transactions for Event ${event.name}.`);
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
