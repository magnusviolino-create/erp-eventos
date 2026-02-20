import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'magnus.violino@gmail.com';
    const password = '123456';

    try {
        console.log(`Looking for user: ${email}`);
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log('User NOT found in database.');
            return;
        }

        console.log('User found. Verifying password...');
        const isValid = await bcrypt.compare(password, user.password);

        if (isValid) {
            console.log('✅ Password matches correctly.');
        } else {
            console.log('❌ Password DOES NOT match.');
            console.log('Updating password to ensure access...');
            const newHash = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email },
                data: { password: newHash }
            });
            console.log('✅ Password has been reset to "123456".');
        }

    } catch (e) {
        console.error('Error during verification:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
