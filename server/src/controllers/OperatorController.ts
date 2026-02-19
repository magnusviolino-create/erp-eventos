
import type { Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

const operatorSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export const getOperators = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const operators = await prisma.operator.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(operators);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch operators' });
    }
};

export const createOperator = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name } = operatorSchema.parse(req.body);

        // Check duplication? User didn't strictly say, but good practice.
        // Simple name check
        const existing = await prisma.operator.findFirst({ where: { name } });
        if (existing) {
            res.status(400).json({ error: 'Operator already exists' });
            return;
        }

        const operator = await prisma.operator.create({
            data: { name },
        });
        res.status(201).json(operator);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: 'Failed to create operator' });
    }
};

export const updateOperator = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name } = operatorSchema.parse(req.body);

        const operator = await prisma.operator.update({
            where: { id },
            data: { name },
        });
        res.json(operator);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update operator' });
    }
};

export const deleteOperator = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.operator.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete operator' });
    }
};
