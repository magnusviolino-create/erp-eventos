
import type { Request, Response } from 'express';
import { PrismaClient, Role, TransactionType, TransactionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true }
        });
        res.json({ count: users.length, users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list users', details: error });
    }
};

export const runSeed = async (req: Request, res: Response) => {
    try {
        const password = await bcrypt.hash('123456', 10);

        // 1. Create Master User
        const master = await prisma.user.upsert({
            where: { email: 'magnus.violino@gmail.com' },
            update: { password },
            create: {
                email: 'magnus.violino@gmail.com',
                name: 'Magnus Master',
                password,
                role: 'MASTER' as Role,
            },
        });

        // 2. Create Unit
        const unit = await prisma.unit.upsert({
            where: { name: 'Sebrae Roraima' },
            update: {},
            create: { name: 'Sebrae Roraima' },
        });

        res.json({ message: 'Seed executed successfully', master, unit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Seed failed', details: error });
    }
};

export const cleanupEvents = async (req: Request, res: Response) => {
    try {
        console.log('Cleaning up duplicate "Decola Roraima" events...');
        const events = await prisma.event.findMany({
            where: { name: 'Decola Roraima' },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { transactions: true, requisitions: true } } }
        });

        if (events.length <= 1) {
            res.json({ message: 'No duplicates to clean.', count: events.length });
            return;
        }

        const keeper = events[0]!;
        const toDelete = events.slice(1);

        for (const evt of toDelete) {
            // Delete related transactions and requisitions first if cascade isn't set up
            await prisma.transaction.deleteMany({ where: { eventId: evt.id } });
            await prisma.requisition.deleteMany({ where: { eventId: evt.id } });
            await prisma.event.delete({ where: { id: evt.id } });
        }

        res.json({
            message: 'Cleanup finished',
            kept: { id: keeper.id, created: keeper.createdAt },
            deleted: toDelete.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Cleanup failed', details: error });
    }
};

export const fixRequisitions = async (req: Request, res: Response) => {
    try {
        console.log('Fixing missing requisitions...');
        // Find transactions with requisitionNum but NO requisitionId
        const txs = await prisma.transaction.findMany({
            where: {
                requisitionNum: { not: null },
                requisitionId: null
            }
        });

        if (txs.length === 0) {
            res.json({ message: 'No orphan transactions found.' });
            return;
        }

        // Group by (eventId, requisitionNum)
        const groups = new Map<string, typeof txs>();
        for (const tx of txs) {
            if (!tx.requisitionNum || !tx.eventId) continue;
            const key = `${tx.eventId}|${tx.requisitionNum}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(tx);
        }

        const stats = { created: 0, updated: 0 };

        for (const [key, group] of groups.entries()) {
            const [eventId, numStr] = key.split('|');
            const num = parseInt(numStr || '0', 10);

            // Create Requisition
            let requisition = await prisma.requisition.findFirst({
                where: { eventId, number: num }
            });

            if (!requisition) {
                requisition = await prisma.requisition.create({
                    data: {
                        eventId: eventId!,
                        number: num || undefined,
                    }
                });
                stats.created++;
            }

            // Link transactions
            await prisma.transaction.updateMany({
                where: { id: { in: group.map(t => t.id) } },
                data: { requisitionId: requisition.id }
            });
            stats.updated += group.length;
        }

        res.json({ message: 'Fix execution finished', stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fix failed', details: error });
    }
};
