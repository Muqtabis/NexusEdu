import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UserService {
  
  // 1. GET USER BY ID
  async getUserById(id: number) {
    return await prisma.user.findUnique({
      where: { id: id },
      include: { assignments: true, attendance: true }
    });
  }

  // 2. GET CLASS LIST
  async getClassList() {
    return await prisma.user.findMany({
      where: { role: 'student' },
      select: { id: true, name: true, email: true, assignments: true, branch: true }
    });
  }

  // 3. CREATE NEW USER
  async createUser(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('User already exists');

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

  // 4. VALIDATE USER
  async validateUser(email: string, pass: string) {
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // 5. SAVE ATTENDANCE
  async saveAttendance(data: { studentId: number; status: string; date: string }) {
    return await prisma.attendance.create({
      data: {
        userId: data.studentId,
        status: data.status,
        date: new Date(data.date),
      },
    });
  }

  // 6. CREATE ASSIGNMENT
  async createAssignment(data: { title: string; subject: string; dueDate: string; studentId: number }) {
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

  // 7. SUBMIT ASSIGNMENT (Updated for File Upload)
  async submitAssignment(assignmentId: number, fileUrl?: string) {
    return await prisma.assignment.update({
      where: { id: assignmentId },
      data: { 
        status: 'submitted',
        submissionUrl: fileUrl || null // Save the link if provided
      }
    });
  }
  // 8. GRADE ASSIGNMENT
  async gradeAssignment(assignmentId: number, grade: string, feedback: string) {
    return await prisma.assignment.update({
      where: { id: assignmentId },
      data: { 
        status: 'graded',
        grade: grade,
        feedback: feedback
      }
    });
  }

  // 9. ADMIN STATS
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

  // 10. GET ALL USERS
  async getAllUsers() {
    return await prisma.user.findMany({
      orderBy: { id: 'desc' },
      select: { id: true, name: true, email: true, role: true }
    });
  }

  // 11. DELETE USER
  async deleteUser(id: number) {
    await prisma.attendance.deleteMany({ where: { userId: id } });
    await prisma.assignment.deleteMany({ where: { userId: id } });
    return await prisma.user.delete({ where: { id: id } });
  }
  // 12. PUBLISH EXAM RESULT (For Teachers)
  async publishExamResult(data: { studentId: number; examName: string; score: number; maxScore: number }) {
    return await prisma.examResult.create({
      data: {
        studentId: data.studentId,
        examName: data.examName,
        score: data.score,
        maxScore: data.maxScore
      }
    });
  }

  // 13. GET STUDENT RESULTS (For Students)
  async getStudentResults(studentId: number) {
    return await prisma.examResult.findMany({
      where: { studentId: studentId },
      orderBy: { date: 'desc' }
    });
  }
  // 14. BULK PUBLISH RESULTS
  async publishBulkResults(results: { studentId: number; examName: string; score: number; maxScore: number }[]) {
    // Prisma's createMany is super fast for this
    return await prisma.examResult.createMany({
      data: results
    });
  }
  // 15. GET ALL EXAM RESULTS (For Admin)
  async getAllExamResults() {
    return await prisma.examResult.findMany({
      include: { 
        student: { 
          select: { name: true, email: true } // We need the name to show in the table
        } 
      },
      orderBy: { date: 'desc' } // Newest exams first
    });
  }
}