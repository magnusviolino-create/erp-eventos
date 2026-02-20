import { PrismaClient, Role, TransactionType, TransactionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Create Master User
    const password = await bcrypt.hash('123456', 10);
    const master = await prisma.user.upsert({
        where: { email: 'magnus.violino@gmail.com' },
        update: {
            password, // Force update password
        },
        create: {
            email: 'magnus.violino@gmail.com',
            name: 'Magnus Master',
            password,
            role: Role.MASTER,
        },
    });

    console.log('Master User:', master);

    // 2. Create Unit
    const unit = await prisma.unit.upsert({
        where: { name: 'Sebrae Roraima' },
        update: {},
        create: {
            name: 'Sebrae Roraima',
        },
    });

    console.log('Unit Created:', unit);

    // 3. Create Unit Manager
    const manager = await prisma.user.upsert({
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

    // 4. Create Event: Decola Roraima
    const event = await prisma.event.create({
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
                create: []
            },
            requisitions: {
                create: [
                    {
                        number: 25,
                        transactions: {
                            create: [
                                {
                                    description: 'Banner',
                                    amount: 1000,
                                    type: TransactionType.EXPENSE,
                                    status: TransactionStatus.APPROVED,
                                    requisitionNum: '25',
                                    serviceOrderNum: '1524',
                                    date: new Date('2026-02-16'),
                                    quantity: 1
                                }
                            ]
                        }
                    },
                    {
                        number: 26,
                        transactions: {
                            create: [
                                {
                                    description: 'Painel em lona',
                                    amount: 5000,
                                    type: TransactionType.EXPENSE,
                                    status: TransactionStatus.QUOTATION,
                                    requisitionNum: '26',
                                    serviceOrderNum: '3506',
                                    date: new Date('2026-02-16'),
                                    quantity: 1
                                }
                            ]
                        }
                    }
                ]
            }
        },
    });

    console.log('Event Created:', event);

    // 5. Create Operators
    const specificOperators = [
        'Magno', 'Vandson', 'Itallo', 'Maria', 'Kauê',
        'Julianne', 'Giovanna', 'Agência', 'Ronaldo'
    ];

    console.log('Cleaning old Operators...');
    try {
        await prisma.operator.deleteMany({});
    } catch (e) {
        console.log('Error cleaning operators:', e);
    }

    console.log('Seeding Correct Operators...');
    for (const name of specificOperators) {
        const exists = await prisma.operator.findFirst({ where: { name } });
        if (!exists) {
            await prisma.operator.create({ data: { name } });
        }
    }

    // 6. Create Services
    const servicesData = [
        'Criação de Card', 'Criação de Banner', 'Edição de Vídeo', 'Fotografia', 'Filmagem',
        'Gestão de Tráfego', 'Redação', 'Revisão', 'Cerimonial', 'Recepção'
    ];

    console.log('Seeding Services...');
    for (const name of servicesData) {
        const exists = await prisma.service.findFirst({ where: { name } });
        if (!exists) {
            await prisma.service.create({ data: { name } });
        }
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
