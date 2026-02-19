import type { Request, Response } from 'express';
import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

const transactionSchema = z.object({
    description: z.string().min(1),
    amount: z.number().min(0),
    type: z.nativeEnum(TransactionType),
    status: z.nativeEnum(TransactionStatus).optional().default(TransactionStatus.QUOTATION),
    requisitionNum: z.string().optional(),
    serviceOrderNum: z.string().optional(),
    eventId: z.string().uuid(),
    requisitionId: z.string().uuid().optional(),
    quantity: z.number().int().min(1).default(1),
    deliveryDate: z.string().transform((str) => new Date(str)).optional(),
});

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { description, amount, type, eventId, requisitionNum, serviceOrderNum, status, requisitionId, quantity, deliveryDate } = transactionSchema.parse(req.body);
        const { id: userId, unitId, role } = req.user;

        const event = await prisma.event.findUnique({ where: { id: eventId } });

        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }

        // Access Control
        if (role === 'OBSERVER') {
            res.status(403).json({ error: 'Observers cannot create transactions' });
            return;
        }

        if (role !== 'MASTER') {
            if (unitId && event.unitId !== unitId) {
                res.status(403).json({ error: 'Access denied: Event belongs to another unit' });
                return;
            }
            if (!unitId && event.userId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
        }

        const transaction = await prisma.transaction.create({
            data: {
                description,
                amount,
                type,
                eventId,
                requisitionNum,
                serviceOrderNum,
                status,
                requisitionId,
                quantity,
                deliveryDate,
            },
        });

        res.status(201).json(transaction);
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation Error', details: (error as any).errors });
            return;
        }
        res.status(400).json({ error: 'Failed to create transaction', details: error.message || error });
    }
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        const { role, unitId, id: userId } = req.user;

        if (role === 'OBSERVER') {
            res.status(403).json({ error: 'Observers cannot delete transactions' });
            return;
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: { event: true } // Need event to check unit/manage access
        });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        // Type assertion for event since include was used
        const event = (transaction as any).event;

        // Access Control
        if (role !== 'MASTER') {
            if (unitId && event.unitId !== unitId) {
                res.status(403).json({ error: 'Access denied: Transaction belongs to another unit' });
                return;
            }
            if (!unitId && event.userId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
        }

        await prisma.transaction.delete({ where: { id } });
        res.status(204).send();

    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
};

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        const { role, unitId, id: userId } = req.user;

        const updateSchema = z.object({
            description: z.string().min(1).optional(),
            amount: z.number().min(0).optional(),
            requisitionNum: z.string().optional(),
            serviceOrderNum: z.string().optional(),
            status: z.nativeEnum(TransactionStatus).optional(),
            quantity: z.number().int().min(1).optional(),
            deliveryDate: z.string().transform((str) => new Date(str)).optional(),
        });

        const { description, amount, requisitionNum, serviceOrderNum, status, quantity, deliveryDate } = updateSchema.parse(req.body);

        if (role === 'OBSERVER') {
            res.status(403).json({ error: 'Observers cannot update transactions' });
            return;
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: { event: true }
        });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        const event = (transaction as any).event;

        if (role !== 'MASTER') {
            if (unitId && event.unitId !== unitId) {
                res.status(403).json({ error: 'Access denied: Transaction belongs to another unit' });
                return;
            }
            if (!unitId && event.userId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
        }

        const updatedTransaction = await prisma.transaction.update({
            where: { id },
            data: {
                description,
                amount,
                requisitionNum,
                serviceOrderNum,
                status,
                quantity,
                deliveryDate,
            },
        });

        res.json(updatedTransaction);
    } catch (error: any) {
        console.error('Error updating transaction:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation Error', details: (error as any).errors });
            return;
        }
        res.status(400).json({ error: 'Failed to update transaction', details: error.message || error });
    }
};
