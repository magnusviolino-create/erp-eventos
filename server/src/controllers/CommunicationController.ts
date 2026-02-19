
import type { Response } from 'express';
import { PrismaClient, CommunicationStatus } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

const communicationSchema = z.object({
    eventId: z.string().uuid(),
    serviceId: z.string().uuid(),
    operatorId: z.string().uuid().optional(),
    deliveryDate: z.string().or(z.date()).transform(val => new Date(val)),
    quantity: z.number().int().positive().default(1),
    status: z.nativeEnum(CommunicationStatus),
});

export const getCommunicationItems = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { eventId } = req.query;
        if (!eventId || typeof eventId !== 'string') {
            res.status(400).json({ error: 'Event ID is required' });
            return;
        }

        const items = await prisma.communicationItem.findMany({
            where: { eventId },
            include: {
                service: true,
                operator: true,
            },
            orderBy: { deliveryDate: 'desc' },
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch communication items' });
    }
};

export const createCommunicationItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = communicationSchema.parse(req.body);

        const item = await prisma.communicationItem.create({
            data: {
                eventId: data.eventId,
                serviceId: data.serviceId,
                operatorId: data.operatorId,
                deliveryDate: data.deliveryDate,
                quantity: data.quantity,
                status: data.status,
            },
            include: {
                service: true,
                operator: true,
            }
        });
        res.status(201).json(item);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: 'Failed to create communication item', details: error });
    }
};

export const updateCommunicationItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // Allow partial updates? For now assume full re-submit or mostly full.
        // Actually, let's use the same schema but partial maybe?
        // Or just let the FE send everything. Dashboard usually sends all.
        const data = communicationSchema.partial().parse(req.body);

        const item = await prisma.communicationItem.update({
            where: { id },
            data,
            include: {
                service: true,
                operator: true,
            }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update communication item' });
    }
};

export const deleteCommunicationItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.communicationItem.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete communication item' });
    }
};
