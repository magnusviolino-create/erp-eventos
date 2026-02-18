import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';


import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import userRoutes from './routes/user.routes.js';
import unitRoutes from './routes/unit.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// @ts-ignore
app.use(helmet());
app.use(cors());
app.use(express.json());



app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
    res.send('Events ERP API is running');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

import { PrismaClient, Role, TransactionType, TransactionStatus } from '@prisma/client';
import { hashPassword } from './utils/hash.js';

const prisma = new PrismaClient();

app.get('/api/public/seed', async (req, res) => {
    try {
        // 1. Create Master User
        const password = await hashPassword('123456');
        const master = await prisma.user.upsert({
            where: { email: 'magnus.violino@gmail.com' },
            update: { password },
            create: {
                email: 'magnus.violino@gmail.com',
                name: 'Magnus Master',
                password,
                role: Role.MASTER,
            },
        });

        // 2. Create Unit
        const unit = await prisma.unit.upsert({
            where: { name: 'Sebrae Roraima' },
            update: {},
            create: { name: 'Sebrae Roraima' },
        });

        // 3. Create Unit Manager
        await prisma.user.upsert({
            where: { email: 'gerente@sebrae.com.br' },
            update: {},
            create: {
                email: 'gerente@sebrae.com.br',
                name: 'Gerente Sebrae',
                password,
                role: Role.MANAGER,
                unitId: unit.id,
            },
        });

        // 4. Create Event if master exists
        await prisma.event.create({
            data: {
                name: 'Decola Roraima',
                startDate: new Date('2026-02-27T03:00:00.000Z'),
                endDate: new Date('2026-03-27T06:30:00.000Z'),
                location: 'D Rosi',
                description: 'Um evento para muita gente',
                budget: 50000,
                userId: master.id,
                unitId: unit.id,
                transactions: {
                    create: [
                        {
                            description: 'Banner',
                            amount: 1000,
                            type: TransactionType.EXPENSE,
                            status: TransactionStatus.APPROVED,
                            requisitionNum: '25',
                            serviceOrderNum: '1524',
                            date: new Date('2026-02-16')
                        }
                    ]
                }
            },
        });

        res.send('Database seeded successfully!');
    } catch (error: any) {
        console.error('Seeding error:', error);
        res.status(500).json({ error: 'Failed to seed', details: error.message || error });
    }
});

export default app;
