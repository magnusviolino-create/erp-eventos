
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
        const { role } = req.user;

        const event = await prisma.event.findUnique({ where: { id: data.eventId } });
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }

        if (event.status === 'COMPLETED' && role !== 'MASTER') {
            res.status(403).json({ error: 'Cannot create requisitions for a completed event' });
            return;
        }

        // Generate a random 6-digit number
        // Loop to ensure uniqueness (basic collision check)
        let number = Math.floor(100000 + Math.random() * 900000);
        let exists = await prisma.requisition.findFirst({ where: { number } });
        while (exists) {
            number = Math.floor(100000 + Math.random() * 900000);
            exists = await prisma.requisition.findFirst({ where: { number } });
        }

        const requisition = await prisma.requisition.create({
            data: {
                eventId: data.eventId,
                number: number,
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
        const { role } = req.user;

        const requisition = await prisma.requisition.findUnique({
            where: { id },
            include: { event: true }
        });

        if (!requisition) {
            res.status(404).json({ error: 'Requisition not found' });
            return;
        }

        if (requisition.event.status === 'COMPLETED' && role !== 'MASTER') {
            res.status(403).json({ error: 'Cannot delete requisitions from a completed event' });
            return;
        }
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
