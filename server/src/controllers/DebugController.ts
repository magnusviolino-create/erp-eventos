
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
