import type { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';
import { hashPassword } from '../utils/hash.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

const createUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(Role),
    unitId: z.string().optional(),
});

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Only MASTER can list users
        if (req.user.role !== Role.MASTER) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, unitId: true, unit: { select: { name: true } } },
            orderBy: { name: 'asc' },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Only MASTER can create users
        if (req.user.role !== Role.MASTER) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const { name, email, password, role, unitId } = createUserSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                unitId: unitId || null,
            },
        });

        res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(400).json({ error: 'Failed to create user', details: error });
    }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (req.user.role !== Role.MASTER) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, unitId: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.nativeEnum(Role).optional(),
    unitId: z.string().optional().nullable(),
});

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        if (req.user.role !== Role.MASTER) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const data = updateUserSchema.parse(req.body);

        let updateData: any = { ...data };
        if (data.password) {
            updateData.password = await hashPassword(data.password);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update user', details: error });
    }
};

const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
});

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const data = updateProfileSchema.parse(req.body);

        let updateData: any = { ...data };
        if (data.password) {
            updateData.password = await hashPassword(data.password);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update profile', details: error });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        if (req.user.role !== Role.MASTER) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Prevent deleting yourself
        if (req.user.id === id) {
            res.status(400).json({ error: 'Cannot delete yourself' });
            return;
        }

        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
