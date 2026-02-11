"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let UserService = class UserService {
    async getUserById(id) {
        return await prisma.user.findUnique({
            where: { id: id },
            include: { assignments: true, attendance: true }
        });
    }
    async getClassList() {
        return await prisma.user.findMany({
            where: { role: 'student' },
            select: { id: true, name: true, email: true, assignments: true, branch: true }
        });
    }
    async createUser(data) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw new Error('User already exists');
        return await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
                branch: data.branch || "General",
                assignments: data.role === 'student' ? {
                    create: [{ title: 'Welcome to NexusEdu', subject: 'General', dueDate: new Date() }]
                } : undefined
            }
        });
    }
    async validateUser(email, pass) {
        const user = await prisma.user.findUnique({ where: { email: email } });
        if (user && user.password === pass) {
            const { password } = user, result = __rest(user, ["password"]);
            return result;
        }
        return null;
    }
    async saveAttendance(data) {
        return await prisma.attendance.create({
            data: {
                userId: data.studentId,
                status: data.status,
                date: new Date(data.date),
            },
        });
    }
    async createAssignment(data) {
        return await prisma.assignment.create({
            data: {
                title: data.title,
                subject: data.subject,
                dueDate: new Date(data.dueDate),
                status: 'pending',
                userId: data.studentId,
            },
        });
    }
    async submitAssignment(assignmentId, fileUrl) {
        return await prisma.assignment.update({
            where: { id: assignmentId },
            data: {
                status: 'submitted',
                submissionUrl: fileUrl || null
            }
        });
    }
    async gradeAssignment(assignmentId, grade, feedback) {
        return await prisma.assignment.update({
            where: { id: assignmentId },
            data: {
                status: 'graded',
                grade: grade,
                feedback: feedback
            }
        });
    }
    async getAdminStats() {
        const totalStudents = await prisma.user.count({ where: { role: 'student' } });
        const totalTeachers = await prisma.user.count({ where: { role: 'teacher' } });
        const totalAssignments = await prisma.assignment.count();
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { id: 'desc' },
            select: { id: true, name: true, role: true, email: true }
        });
        return { totalStudents, totalTeachers, totalAssignments, recentUsers };
    }
    async getAllUsers() {
        return await prisma.user.findMany({
            orderBy: { id: 'desc' },
            select: { id: true, name: true, email: true, role: true }
        });
    }
    async deleteUser(id) {
        await prisma.attendance.deleteMany({ where: { userId: id } });
        await prisma.assignment.deleteMany({ where: { userId: id } });
        return await prisma.user.delete({ where: { id: id } });
    }
    async publishExamResult(data) {
        return await prisma.examResult.create({
            data: {
                studentId: data.studentId,
                examName: data.examName,
                score: data.score,
                maxScore: data.maxScore
            }
        });
    }
    async getStudentResults(studentId) {
        return await prisma.examResult.findMany({
            where: { studentId: studentId },
            orderBy: { date: 'desc' }
        });
    }
    async publishBulkResults(results) {
        return await prisma.examResult.createMany({
            data: results
        });
    }
    async getAllExamResults() {
        return await prisma.examResult.findMany({
            include: {
                student: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { date: 'desc' }
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)()
], UserService);
//# sourceMappingURL=user.service.js.map