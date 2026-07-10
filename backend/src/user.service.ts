import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "./prisma.service";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private sanitizeUser(user: { password: string; [key: string]: any }) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  // 1. GET USER BY ID
  async getUserById(id: number) {
    return await this.prisma.user.findUnique({
      where: { id: id },
      // ðŸ‘‡ We added examResults: true right here!
      include: { assignments: true, attendance: true, examResults: true },
    });
  }

  // 2. GET CLASS LIST
  async getClassList() {
    return await this.prisma.user.findMany({
      where: { role: "student" },
      select: {
        id: true,
        name: true,
        email: true,
        assignments: true,
        branch: true,
      },
    });
  }

  // 3. CREATE NEW USER (Updated with Bulletproof Fallbacks & Logs)
  async createUser(data: any) {
    const email = this.normalizeEmail(data.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpException(
        "Email already registered",
        HttpStatus.BAD_REQUEST,
      );
    }

    const password = data.password || data.pass;
    if (!password) {
      throw new HttpException("Password is required", HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const createdUser = await this.prisma.user.create({
      data: {
        name: data.name?.trim() || "Test User",
        email,
        password: hashedPassword,
        role: data.role || "student",
        branch: data.branch?.trim() || "General",
        rollNumber: data.rollNumber?.trim() || null,
        assignments:
          data.role === "student" || !data.role
            ? {
                create: [
                  {
                    title: "Welcome to NexusEdu",
                    subject: "General",
                    dueDate: new Date(),
                  },
                ],
              }
            : undefined,
      },
    });

    return this.sanitizeUser(createdUser);
  }

  // 4. VALIDATE USER (Updated with Logs)
  async validateUser(email: string, pass: string) {
    if (!email || !pass) {
      return null;
    }

    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return null;
    }

    const passwordIsHashed = user.password.startsWith("$2");
    const passwordMatches = passwordIsHashed
      ? await bcrypt.compare(pass, user.password)
      : user.password === pass;

    if (!passwordMatches) {
      return null;
    }

    if (!passwordIsHashed) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(pass, 12) },
      });
    }

    return this.sanitizeUser(user);
  }

  // 5. SAVE ATTENDANCE
  async saveAttendance(data: {
    studentId: number;
    status: string;
    date: string;
  }) {
    return await this.prisma.attendance.create({
      data: {
        userId: data.studentId,
        status: data.status,
        date: new Date(data.date),
      },
    });
  }

  // 6. CREATE ASSIGNMENT
  async createAssignment(data: {
    title: string;
    subject: string;
    dueDate: string;
    studentId: number;
  }) {
    return await this.prisma.assignment.create({
      data: {
        title: data.title,
        subject: data.subject,
        dueDate: new Date(data.dueDate),
        status: "pending",
        userId: data.studentId,
      },
    });
  }

  // 7. SUBMIT ASSIGNMENT
  async submitAssignment(assignmentId: number, fileUrl?: string) {
    return await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: "submitted",
        submissionUrl: fileUrl || null,
      },
    });
  }

  // 8. GRADE ASSIGNMENT
  async gradeAssignment(assignmentId: number, grade: string, feedback: string) {
    return await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: "graded",
        grade: grade,
        feedback: feedback,
      },
    });
  }

  // 9. ADMIN STATS
  async getAdminStats() {
    const totalStudents = await this.prisma.user.count({
      where: { role: "student" },
    });
    const totalTeachers = await this.prisma.user.count({
      where: { role: "teacher" },
    });
    const totalAssignments = await this.prisma.assignment.count();
    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { id: "desc" },
      select: { id: true, name: true, role: true, email: true },
    });
    return { totalStudents, totalTeachers, totalAssignments, recentUsers };
  }

  // 10. GET ALL USERS
  async getAllUsers() {
    return await this.prisma.user.findMany({
      orderBy: { id: "desc" },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  // 11. DELETE USER
  async deleteUser(id: number) {
    await this.prisma.attendance.deleteMany({ where: { userId: id } });
    await this.prisma.assignment.deleteMany({ where: { userId: id } });
    return await this.prisma.user.delete({ where: { id: id } });
  }

  // 12. PUBLISH EXAM RESULT
  async publishExamResult(data: {
    studentId: number;
    examName: string;
    score: number;
    maxScore: number;
  }) {
    return await this.prisma.examResult.create({
      data: {
        studentId: data.studentId,
        examName: data.examName,
        score: data.score,
        maxScore: data.maxScore,
      },
    });
  }

  // 13. GET STUDENT RESULTS
  async getStudentResults(studentId: number) {
    return await this.prisma.examResult.findMany({
      where: { studentId: studentId },
      orderBy: { date: "desc" },
    });
  }

  // 14. BULK PUBLISH RESULTS
  async publishBulkResults(
    results: {
      studentId: number;
      examName: string;
      score: number;
      maxScore: number;
    }[],
  ) {
    return await this.prisma.examResult.createMany({
      data: results,
    });
  }

  // 15. GET ALL EXAM RESULTS
  async getAllExamResults() {
    return await this.prisma.examResult.findMany({
      include: {
        student: {
          select: { name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
    });
  }
}
