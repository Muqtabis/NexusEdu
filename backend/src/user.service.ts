import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UserService {
  
  // 1. GET USER BY ID
  async getUserById(id: number) {
    return await prisma.user.findUnique({
      where: { id: id },
      // 👇 We added examResults: true right here!
      include: { assignments: true, attendance: true, examResults: true } 
    });
  }

  // 2. GET CLASS LIST
  async getClassList() {
    return await prisma.user.findMany({
      where: { role: 'student' },
      select: { id: true, name: true, email: true, assignments: true, branch: true }
    });
  }

  // 3. CREATE NEW USER (Updated with Bulletproof Fallbacks & Logs)
  async createUser(data: any) {
    console.log("📥 Registration Data Received from Frontend:", data);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('User already exists');

    try {
      return await prisma.user.create({
        data: {
          name: data.name || "Test User",
          email: data.email,
          // Handle both 'password' and 'pass' depending on what React sends
          password: data.password || data.pass, 
          // Default to student if the frontend forgets to send a role
          role: data.role || 'student', 
          branch: data.branch || "General",
          assignments: (data.role === 'student' || !data.role) ? {
            create: [{ title: 'Welcome to NexusEdu', subject: 'General', dueDate: new Date() }]
          } : undefined
        }
      });
    } catch (err) {
      console.error("❌ PRISMA DATABASE ERROR:", err);
      throw err;
    }
  }

  // 4. VALIDATE USER (Updated with Logs)
  async validateUser(email: string, pass: string) {
    console.log(`🔐 Login Attempt: Email=${email} | Pass=${pass}`);
    
    const user = await prisma.user.findUnique({ where: { email: email } });
    
    // Check if the user exists and the passwords match
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    
    console.log("❌ Login Failed: User not found or password did not match.");
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

  // 7. SUBMIT ASSIGNMENT 
  async submitAssignment(assignmentId: number, fileUrl?: string) {
    return await prisma.assignment.update({
      where: { id: assignmentId },
      data: { 
        status: 'submitted',
        submissionUrl: fileUrl || null 
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

  // 12. PUBLISH EXAM RESULT 
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

  // 13. GET STUDENT RESULTS
  async getStudentResults(studentId: number) {
    return await prisma.examResult.findMany({
      where: { studentId: studentId },
      orderBy: { date: 'desc' }
    });
  }

  // 14. BULK PUBLISH RESULTS
  async publishBulkResults(results: { studentId: number; examName: string; score: number; maxScore: number }[]) {
    return await prisma.examResult.createMany({
      data: results
    });
  }

  // 15. GET ALL EXAM RESULTS
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
}