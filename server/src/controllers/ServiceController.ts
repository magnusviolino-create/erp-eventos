
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

const serviceSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

export const getServices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const services = await prisma.service.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
};

export const createService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = serviceSchema.parse(req.body);

        const service = await prisma.service.create({
            data,
        });
        res.status(201).json(service);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
            return;
        }
        res.status(500).json({ error: 'Failed to create service' });
    }
};

export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        const data = serviceSchema.parse(req.body);

        const service = await prisma.service.update({
            where: { id },
            data,
        });
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update service' });
    }
};

export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        await prisma.service.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete service' });
    }
};
