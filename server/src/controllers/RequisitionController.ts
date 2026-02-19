
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

const requisitionSchema = z.object({
    eventId: z.string().uuid(),
});

export const getRequisitions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { eventId } = req.query;
        if (!eventId || typeof eventId !== 'string') {
            res.status(400).json({ error: 'Event ID is required' });
            return;
        }

        const requisitions = await prisma.requisition.findMany({
            where: { eventId },
            include: {
                transactions: true,
            },
            orderBy: { number: 'desc' },
        });
        res.json(requisitions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requisitions' });
    }
};

export const createRequisition = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = requisitionSchema.parse(req.body);

        const requisition = await prisma.requisition.create({
            data: {
                eventId: data.eventId,
            },
            include: {
                transactions: true,
            }
        });
        res.status(201).json(requisition);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
            return;
        }
        res.status(500).json({ error: 'Failed to create requisition' });
    }
};

export const deleteRequisition = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        await prisma.requisition.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete requisition' });
    }
};

export const getRequisitionById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        const requisition = await prisma.requisition.findUnique({
            where: { id },
            include: { transactions: true }
        });
        if (!requisition) {
            res.status(404).json({ error: 'Requisition not found' });
            return;
        }
        res.json(requisition);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requisition' });
    }
};
