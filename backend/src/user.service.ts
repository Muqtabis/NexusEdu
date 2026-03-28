import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UserService {
  
  // 1. GET USER BY ID
  async getUserById(id: number) {
    return await prisma.user.findUnique({
      where: { id: id },
      include: { assignments: true, attendance: true, examResults: true}
    });
  }

  // 2. GET CLASS LIST
  async getClassList() {
    return await prisma.user.findMany({
      where: { role: 'student' },
      select: { 
        id: true, name: true, email: true, assignments: true, 
        branch: true, rollNumber: true 
      }
    });
  }

  // 3. CREATE NEW USER
  async createUser(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('User already exists');

    if (data.role === 'student' && data.branch && data.rollNumber) {
      const duplicate = await prisma.user.findFirst({
        where: { 
          role: 'student',
          branch: data.branch,
          rollNumber: data.rollNumber
        }
      });
      if (duplicate) throw new Error(`Roll Number ${data.rollNumber} already exists in ${data.branch}`);
    }

    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        branch: data.branch || "General",
        rollNumber: data.rollNumber,         
        classTeacherOf: data.classTeacherOf, 
        assignments: data.role === 'student' ? {
          create: [{ title: 'Welcome Assignment', subject: 'General', dueDate: new Date() }]
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
  async saveAttendance(data: { studentId: number; status: string; date: string; teacherId: number }) {
    const teacher = await prisma.user.findUnique({ where: { id: data.teacherId }, select: { id: true, role: true, classTeacherOf: true } });
    if (!teacher) throw new Error("Teacher not found");

    const student = await prisma.user.findUnique({ where: { id: data.studentId }, select: { id: true, branch: true } });
    if (!student) throw new Error("Student not found");

    if (teacher.role !== 'admin' && teacher.classTeacherOf !== student.branch) {
      throw new Error(`Permission Denied: You are not the Class Teacher of ${student.branch}`);
    }

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
      include: { 
        subjectAllocations: true 
      }
    });
  }

  // 11. DELETE USER
  async deleteUser(id: number) {
    await prisma.attendance.deleteMany({ where: { userId: id } });
    await prisma.assignment.deleteMany({ where: { userId: id } });
    return await prisma.user.delete({ where: { id: id } });
  }

  // 12. PUBLISH EXAM RESULT (Single)
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

  // 15. GET ALL RESULTS (For Admin)
  async getAllExamResults() {
    return await prisma.examResult.findMany({ 
      include: { 
        student: { select: { name: true, email: true, branch: true } } 
      },
      orderBy: { date: 'desc' }
    });
  }

  // 16. ASSIGN CLASS TEACHER
  async assignClassTeacher(teacherId: number, className: string) {
    return await prisma.user.update({
      where: { id: teacherId },
      data: { classTeacherOf: className }
    });
  }

  // 17. ASSIGN SUBJECT TEACHER
  async assignSubject(teacherId: number, className: string, subject: string) {
    const existing = await prisma.subjectAllocation.findFirst({
      where: { teacherId, className, subject }
    });
    if (existing) return existing;

    return await prisma.subjectAllocation.create({
      data: { teacherId, className, subject }
    });
  }

  // 18. REMOVE SUBJECT TEACHER
  async removeSubject(allocationId: number) {
    return await prisma.subjectAllocation.delete({
      where: { id: allocationId }
    });
  }

  // 19. GET MY STUDENTS
  async getTeacherStudents(teacherId: number) {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { subjectAllocations: true }
    });

    if (!teacher) throw new Error("Teacher not found");

    const dashboardOptions: any[] = [];
    const uniqueClasses = new Set<string>();

    if (teacher.classTeacherOf) {
      dashboardOptions.push({
        label: `${teacher.classTeacherOf} (Class Teacher)`,
        className: teacher.classTeacherOf,
        subject: "General",
        role: "class_teacher"
      });
      uniqueClasses.add(teacher.classTeacherOf);
    }

    teacher.subjectAllocations.forEach(alloc => {
      dashboardOptions.push({
        label: `${alloc.subject} - ${alloc.className}`,
        className: alloc.className,
        subject: alloc.subject,
        role: "subject_teacher"
      });
      uniqueClasses.add(alloc.className);
    });

    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        branch: { in: Array.from(uniqueClasses) }
      },
      include: { assignments: true },
      orderBy: { rollNumber: 'asc' }
    });

    return {
      students,
      dashboardOptions, 
      classTeacherOf: teacher.classTeacherOf
    };
  }

  // 20. ADD OR UPDATE TIMETABLE SLOT
  async addTimetableSlot(data: { className: string; day: string; startTime: string; endTime: string; subject: string; teacherId?: number }) {
    const existingSlot = await prisma.timetable.findFirst({
      where: {
        className: data.className,
        day: data.day,
        startTime: data.startTime
      }
    });

    if (existingSlot) {
      return await prisma.timetable.update({
        where: { id: existingSlot.id },
        data: {
          subject: data.subject,
          teacherId: data.teacherId, 
          endTime: data.endTime
        }
      });
    } else {
      return await prisma.timetable.create({
        data: {
          className: data.className,
          day: data.day,
          startTime: data.startTime,
          endTime: data.endTime,
          subject: data.subject,
          teacherId: data.teacherId
        }
      });
    }
  }

  // 21. GET CLASS TIMETABLE
  async getClassTimetable(className: string) {
    return await prisma.timetable.findMany({
      where: { className },
      orderBy: { startTime: 'asc' },
      include: { teacher: { select: { name: true } } }
    });
  }

  // 22. GET TEACHER TIMETABLE
  async getTeacherTimetable(teacherId: number) {
    return await prisma.timetable.findMany({
      where: { teacherId },
      orderBy: { startTime: 'asc' }
    });
  }

  // 23. ADD SCHOOL EVENT
  async addSchoolEvent(data: { title: string; date: string; description: string; type: string }) {
    return await prisma.schoolEvent.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        description: data.description,
        type: data.type
      }
    });
  }

  // 24. GET UPCOMING EVENTS
  async getSchoolEvents() {
    return await prisma.schoolEvent.findMany({
      orderBy: { date: 'asc' },
      where: {
        date: {
          gte: new Date() 
        }
      }
    });
  }

  // 25. CHANGE PASSWORD LOGIC

  async changePassword(data: any) {
    const { userId, currentPassword, newPassword } = data;

    // Find the user by ID
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if current password matches
    if (user.password !== currentPassword) {
      throw new Error("Incorrect current password");
    }

    // Update the password
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: newPassword }
    });

    return { message: "Password updated successfully!" };
  }
}