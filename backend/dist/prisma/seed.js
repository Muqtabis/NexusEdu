"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const student = await prisma.user.upsert({
        where: { email: 'student@nexus.com' },
        update: {},
        create: {
            email: 'student@nexus.com',
            name: 'Muqtabis',
            role: 'student',
            password: 'password123',
            assignments: {
                create: [
                    { title: 'MySQL Setup Task', subject: 'Database', dueDate: new Date() },
                    { title: 'Physics Lab Report', subject: 'Physics', dueDate: new Date() },
                ],
            },
        },
    });
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@nexus.com' },
        update: {},
        create: {
            email: 'teacher@nexus.com',
            name: 'Prof. X',
            role: 'teacher',
            password: 'password123',
        },
    });
    const admin = await prisma.user.upsert({
        where: { email: 'admin@nexus.com' },
        update: {},
        create: {
            email: 'admin@nexus.com',
            name: 'System Admin',
            role: 'admin',
            password: 'password123',
        },
    });
    console.log({ student, teacher, admin });
}
main()
    .catch((e) => console.error(e))
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map