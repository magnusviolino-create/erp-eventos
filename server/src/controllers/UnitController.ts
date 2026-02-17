import type { Response, Request } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

const createUnitSchema = z.object({
    name: z.string().min(1),
});

export const getUnits = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Users can list units to select one when creating events or users (if MASTER)
        const units = await prisma.unit.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch units' });
    }
};

export const createUnit = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Only MASTER can create units
        if (req.user.role !== Role.MASTER) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const { name } = createUnitSchema.parse(req.body);

        const existingUnit = await prisma.unit.findUnique({ where: { name } });
        if (existingUnit) {
            res.status(400).json({ error: 'Unit already exists' });
            return;
        }

        const unit = await prisma.unit.create({
            data: { name },
        });

        res.status(201).json(unit);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create unit', details: error });
    }
};
