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
        branch: true, rollNumber: true // <--- Add these
      }
    });
  }

 // 3. CREATE NEW USER (Updated for Roll No & Uniqueness)
  async createUser(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('User already exists');

    // CHECK ROLL NUMBER UNIQUENESS (If Student)
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
        rollNumber: data.rollNumber,         // <--- Save Roll No
        classTeacherOf: data.classTeacherOf, // <--- Save Class Teacher assignment
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

  // 5. SAVE ATTENDANCE (Strict Class Teacher Check) 🛡️
  async saveAttendance(data: { studentId: number; status: string; date: string; teacherId: number }) {
    
    // 1. Get the Teacher
    const teacher = await prisma.user.findUnique({ where: { id: data.teacherId }, select: { id: true, role: true, classTeacherOf: true } });
    if (!teacher) throw new Error("Teacher not found");

    // 2. Get the Student (include branch)
    const student = await prisma.user.findUnique({ where: { id: data.studentId }, select: { id: true, branch: true } });
    if (!student) throw new Error("Student not found");

    // 3. THE SECURITY CHECK: Is this teacher the Class Teacher of this student?
    // We allow Admins to bypass this check.
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
      include: { 
        subjectAllocations: true // <--- Fetch the subjects they teach
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
    return await prisma.examResult.create({ // <--- FIXED: Removed 's'
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
    return await prisma.examResult.findMany({ // <--- FIXED: Removed 's'
      where: { studentId: studentId },
      orderBy: { date: 'desc' }
    });
  }

  // 14. BULK PUBLISH RESULTS
  async publishBulkResults(results: { studentId: number; examName: string; score: number; maxScore: number }[]) {
    return await prisma.examResult.createMany({ // <--- FIXED: Removed 's'
      data: results
    });
  }

  // 15. GET ALL RESULTS (For Admin)
  async getAllExamResults() {
    return await prisma.examResult.findMany({ // <--- FIXED: Removed 's'
      include: { 
        student: { select: { name: true, email: true, branch: true } } 
      },
      orderBy: { date: 'desc' }
    });
  }

  // 16. ASSIGN CLASS TEACHER (Admin Only Action)
  async assignClassTeacher(teacherId: number, className: string) {
    return await prisma.user.update({
      where: { id: teacherId },
      data: { classTeacherOf: className }
    });
  }
  // 17. ASSIGN SUBJECT TEACHER (New) ➕
  async assignSubject(teacherId: number, className: string, subject: string) {
    // Check if assignment already exists to prevent duplicates
    const existing = await prisma.subjectAllocation.findFirst({
      where: { teacherId, className, subject }
    });
    if (existing) return existing;

    return await prisma.subjectAllocation.create({
      data: { teacherId, className, subject }
    });
  }

  // 18. REMOVE SUBJECT TEACHER (New) ➖
  async removeSubject(allocationId: number) {
    return await prisma.subjectAllocation.delete({
      where: { id: allocationId }
    });
  }
  // 19. GET MY STUDENTS (Context-Aware Fetch - UPDATED) 🕵️‍♂️
  async getTeacherStudents(teacherId: number) {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { subjectAllocations: true }
    });

    if (!teacher) throw new Error("Teacher not found");

    // 1. Build a list of "Dashboard Options" (What shows in the dropdown)
    const dashboardOptions: any[] = [];
    const uniqueClasses = new Set<string>();

    // A. Add Class Teacher Role
    if (teacher.classTeacherOf) {
      dashboardOptions.push({
        label: `${teacher.classTeacherOf} (Class Teacher)`,
        className: teacher.classTeacherOf,
        subject: "General",
        role: "class_teacher"
      });
      uniqueClasses.add(teacher.classTeacherOf);
    }

    // B. Add Subject Allocations
    teacher.subjectAllocations.forEach(alloc => {
      dashboardOptions.push({
        label: `${alloc.subject} - ${alloc.className}`,
        className: alloc.className,
        subject: alloc.subject,
        role: "subject_teacher"
      });
      uniqueClasses.add(alloc.className);
    });

    // 2. Fetch Students for ALL these classes
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
      dashboardOptions, // <--- Sending the detailed list now!
      classTeacherOf: teacher.classTeacherOf
    };
  }
  // --- TIMETABLE FEATURES ---

  // 20. ADD OR UPDATE TIMETABLE SLOT (Smart Upsert) 🧠
  async addTimetableSlot(data: { className: string; day: string; startTime: string; endTime: string; subject: string; teacherId?: number }) {
    // 1. Check if a slot already exists for this Class + Day + Time
    const existingSlot = await prisma.timetable.findFirst({
      where: {
        className: data.className,
        day: data.day,
        startTime: data.startTime
      }
    });

    if (existingSlot) {
      // 2. UPDATE existing slot
      return await prisma.timetable.update({
        where: { id: existingSlot.id },
        data: {
          subject: data.subject,
          teacherId: data.teacherId, // Optional: Update teacher if provided
          endTime: data.endTime
        }
      });
    } else {
      // 3. CREATE new slot
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
  // 21. GET CLASS TIMETABLE (For Students)
  async getClassTimetable(className: string) {
    return await prisma.timetable.findMany({
      where: { className },
      orderBy: { startTime: 'asc' },
      include: { teacher: { select: { name: true } } }
    });
  }

  // 22. GET TEACHER TIMETABLE (For Teachers)
  async getTeacherTimetable(teacherId: number) {
    return await prisma.timetable.findMany({
      where: { teacherId },
      orderBy: { startTime: 'asc' }
    });
  }
  // 23. ADD SCHOOL EVENT (Admin) 📅
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

  // 24. GET UPCOMING EVENTS (Everyone) 🗓️
  async getSchoolEvents() {
    return await prisma.schoolEvent.findMany({
      orderBy: { date: 'asc' },
      where: {
        date: {
          gte: new Date() // Only show future/today's events
        }
      }
    });
  }
}