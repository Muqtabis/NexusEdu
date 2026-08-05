import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  NotFoundException,
  UseGuards,
  Put,
  Req,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import { UserService } from "./user.service";
import { PrismaService } from "./prisma.service";
import { JwtAuthGuard } from "./auth/jwt.guard";
import { EmailService } from "./email/email.service";
import { MessageService } from "./message.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { CreateCourseDto } from "./dtos/create-course.dto";
import { SubmitAssignmentDto } from "./dtos/submit-assignment.dto";

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly messageService: MessageService,
  ) {}

  private readonly teacherAllocations = new Map<
   number,
   {
     classTeacherOf?: string;
     subjectAllocations: Array<{ id: number; className: string; subject: string }>;
   }
  >();

  private readonly eventFeed: Array<{
   id: number;
   title: string;
   date: string;
   description: string;
   type: string;
  }> = [
   {
     id: 1,
     title: "Welcome Back!",
     date: new Date().toISOString(),
     description: "School reopened for the new academic session.",
     type: "event",
   },
  ];

  private readonly timetables = new Map<
   string,
   Array<{ day: string; startTime: string; endTime: string; subject: string }>
  >();

  private getTeacherAllocation(teacherId: number) {
   const existing = this.teacherAllocations.get(teacherId);
   if (existing) {
     return existing;
   }

   const allocation: {
     classTeacherOf?: string;
     subjectAllocations: Array<{ id: number; className: string; subject: string }>;
   } = {
     classTeacherOf: undefined,
     subjectAllocations: [] as Array<{ id: number; className: string; subject: string }> ,
   };
   this.teacherAllocations.set(teacherId, allocation);
   return allocation;
  }

  private setAuthCookie(res: Response, token: string) {
    // For mobile apps and cross-platform clients (iOS/Android/Windows) it's safer to
    // optionally set SameSite=None and secure cookies when CROSS_PLATFORM=true so
    // embedded webviews or native fetches that rely on cookies work correctly.
    const crossPlatform = process.env.CROSS_PLATFORM === "true";
    const cookieOptions: any = {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    };

    if (crossPlatform) {
      // Requires secure context (HTTPS) in production environments
      cookieOptions.sameSite = "none";
      cookieOptions.secure = true;
    } else {
      cookieOptions.sameSite = "lax";
      cookieOptions.secure = process.env.NODE_ENV === "production";
    }

    res.cookie("nexusedu_auth", token, cookieOptions);
  }

  // ==========================================
  // CSRF TOKEN ENDPOINT (Must come first)
  // ==========================================
  @Get("csrf-token")
  generateCsrfToken() {
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    return { token };
  }

  // ==========================================
  // AUTHENTICATION WITH JWT
  // ==========================================

  // 1. LOGIN - Returns JWT Token
  @Post("login")
  async login(
    @Body() body: { email: string; pass?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const actualPassword = body.password || body.pass;
    if (!actualPassword) {
      throw new HttpException("Password is required", HttpStatus.BAD_REQUEST);
    }

    const user = await this.userService.validateUser(
      body.email,
      actualPassword,
    );
    if (!user)
      throw new HttpException(
        "Invalid email or password",
        HttpStatus.UNAUTHORIZED,
      );

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    this.setAuthCookie(res, token);

    return {
      user,
      token,
      expiresIn: "24h",
    };
  }

  // 2. REGISTER - New user with JWT
  @Post("register")
  async register(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Server-side validation for privileged roles using secret codes.
    // Admin and Teacher codes are configured via environment variables.
    if (body.role === "admin") {
      const expectedSecret = process.env.ADMIN_SECRET_CODE || "ADMIN2026";
      if (body.secretCode !== expectedSecret) {
        throw new HttpException(
          "Invalid admin secret code",
          HttpStatus.FORBIDDEN,
        );
      }
    }

    if (body.role === "teacher") {
      const expectedTeacherSecret = process.env.TEACHER_SECRET_CODE || "TEACHER2026";
      if (body.secretCode !== expectedTeacherSecret) {
        throw new HttpException(
          "Invalid teacher secret code",
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const user = await this.userService.createUser(body);

    await this.emailService
      .sendWelcomeEmail(user.email, user.name)
      .catch((err) =>
        console.log("Email send error (non-blocking):", err.message),
      );

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    this.setAuthCookie(res, token);

    return {
      user,
      token,
      expiresIn: "24h",
    };
  }

  // 3. REFRESH TOKEN
  @Post("auth/refresh")
  @UseGuards(JwtAuthGuard)
  async refreshToken(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    this.setAuthCookie(res, token);

    return { user, expiresIn: "24h" };
  }

  @Post("auth/logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("nexusedu_auth", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return { message: "Logged out successfully" };
  }

  @UseGuards(JwtAuthGuard)
  @Get("teacher/:id/students")
  async getTeacherStudents(@Param("id") id: string) {
    const teacherId = Number(id);
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    const students = await this.prisma.user.findMany({
      where: { role: "student" },
      select: {
        id: true,
        name: true,
        email: true,
        branch: true,
        rollNumber: true,
      },
      orderBy: { name: "asc" },
    });

    const allocation = this.getTeacherAllocation(teacherId);
    const branches = Array.from(
      new Set(students.map((student) => student.branch || "General").filter(Boolean)),
    );

    return {
      teacher,
      students,
      dashboardOptions: branches.map((branch, index) => ({
        id: `${branch}-${index}`,
        label: branch,
        className: branch,
        subject: index % 2 === 0 ? "Mathematics" : "Science",
        role: allocation.classTeacherOf === branch ? "class_teacher" : "subject_teacher",
      })),
      classTeacherOf: allocation.classTeacherOf || null,
      subjectAllocations: allocation.subjectAllocations,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/result-list")
  async getAdminResults(@Req() req: any) {
    if (req.user.role !== "admin") {
      throw new HttpException("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const results = (await this.prisma.examResult.findMany({
      orderBy: { date: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            branch: true,
            email: true,
          },
        },
      },
    })) as Array<any>;

    return results.map((result) => ({
      ...result,
      student: result.student
        ? {
            id: result.student.id,
            name: result.student.name,
            branch: result.student.branch || "General",
            email: result.student.email,
          }
        : null,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Get("events")
  getEvents() {
    return this.eventFeed;
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/event")
  createEvent(@Body() body: { title: string; date: string; type: string; description?: string }, @Req() req: any) {
    if (req.user.role !== "admin") {
      throw new HttpException("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const event = {
      id: this.eventFeed.length + 1,
      title: body.title,
      date: body.date,
      description: body.description || "",
      type: body.type || "event",
    };

    this.eventFeed.unshift(event);
    return event;
  }

  @UseGuards(JwtAuthGuard)
  @Get("timetable/class/:className")
  getClassTimetable(@Param("className") className: string) {
    return this.timetables.get(className) || [];
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/timetable")
  saveClassTimetable(
    @Body()
    body: {
      className: string;
      day?: string;
      startTime?: string;
      endTime?: string;
      subject?: string;
      timetable?: Array<{ day: string; startTime: string; endTime: string; subject: string }>;
    },
    @Req() req: any,
  ) {
    if (req.user.role !== "admin") {
      throw new HttpException("Unauthorized", HttpStatus.FORBIDDEN);
    }
    if (body.timetable) {
      this.timetables.set(body.className, body.timetable);
      return { className: body.className, timetable: body.timetable };
    }

    const existing = this.timetables.get(body.className) || [];
    const filtered = existing.filter(
      (slot) => !(slot.day === body.day && slot.startTime === body.startTime),
    );

    if (body.subject) {
      filtered.push({
        day: body.day!,
        startTime: body.startTime!,
        endTime: body.endTime || body.startTime!,
        subject: body.subject,
      });
    }

    this.timetables.set(body.className, filtered);
    return { className: body.className, timetable: filtered };
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/assign-class-teacher")
  assignClassTeacher(@Body() body: { teacherId: number; className: string }, @Req() req: any) {
    if (req.user.role !== "admin") {
      throw new HttpException("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const allocation = this.getTeacherAllocation(body.teacherId);
    allocation.classTeacherOf = body.className;
    this.teacherAllocations.set(body.teacherId, allocation);
    return allocation;
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/assign-subject")
  assignSubject(@Body() body: { teacherId: number; className: string; subject: string }, @Req() req: any) {
    if (req.user.role !== "admin") {
      throw new HttpException("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const allocation = this.getTeacherAllocation(body.teacherId);
    const existing = allocation.subjectAllocations.find(
      (entry) => entry.className === body.className && entry.subject === body.subject,
    );

    if (!existing) {
      allocation.subjectAllocations.push({
        id: Date.now(),
        className: body.className,
        subject: body.subject,
      });
    }

    this.teacherAllocations.set(body.teacherId, allocation);
    return allocation;
  }

  @UseGuards(JwtAuthGuard)
  @Delete("admin/subject/:id")
  removeSubject(@Param("id") id: string, @Req() req: any) {
    if (req.user.role !== "admin") {
      throw new HttpException("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const subjectId = Number(id);
    for (const allocation of this.teacherAllocations.values()) {
      const remaining = allocation.subjectAllocations.filter((entry) => entry.id !== subjectId);
      if (remaining.length !== allocation.subjectAllocations.length) {
        allocation.subjectAllocations = remaining;
        return { success: true };
      }
    }
    return { success: false };
  }

  // ==========================================
  // PROTECTED ROUTES (Require JWT)
  // ==========================================

  // 3. DASHBOARD DATA
  @Get("dashboard/:id")
  async getDashboardData(@Param("id") id: string) {
    return await this.userService.getUserById(parseInt(id));
  }

  // 4. TEACHER CLASS LIST
  @Get("teacher/class")
  async getClassList() {
    return await this.userService.getClassList();
  }

  // 5. SAVE ATTENDANCE
  @Post("attendance")
  async markAttendance(
    @Body() body: { studentId: number; status: string; date: string },
  ) {
    return await this.userService.saveAttendance(body);
  }

  // 7. CREATE ASSIGNMENT
  @Post("assignment")
  async createAssignment(@Body() body: any) {
    return await this.userService.createAssignment(body);
  }

  // 8. SUBMIT ASSIGNMENT (With File Upload!)
  @Post("assignment/:id/submit")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads", // Files will be saved here
        filename: (req, file, cb) => {
          // Generate a random name to prevent duplicates
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async submitAssignment(@Param("id") id: string, @UploadedFile() file: any) {
    console.log(`File uploaded:`, file?.filename);

    // Create the full URL so the frontend can download it later
    const fileUrl = file
      ? `http://localhost:4000/uploads/${file.filename}`
      : undefined;

    return await this.userService.submitAssignment(Number(id), fileUrl);
  }

  // 9. ADMIN STATS
  @Get("admin/stats")
  async getStats() {
    return await this.userService.getAdminStats();
  }

  // 10. LIST ALL USERS
  @Get("admin/users")
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch: true,
        rollNumber: true,
      },
    });

    return users.map((user) => {
      const allocation = user.role === "teacher" ? this.getTeacherAllocation(user.id) : undefined;
      return {
        ...user,
        classTeacherOf: allocation?.classTeacherOf || null,
        subjectAllocations: allocation?.subjectAllocations || [],
      };
    });
  }

  // 11. DELETE USER
  @Delete("admin/user/:id")
  async deleteUser(@Param("id") id: string) {
    return await this.userService.deleteUser(Number(id));
  }

  // 12. Grade Assignment Route
  @Post("assignment/:id/grade")
  async gradeAssignment(
    @Param("id") id: string,
    @Body() body: { grade: string; feedback: string },
  ) {
    return await this.userService.gradeAssignment(
      Number(id),
      body.grade,
      body.feedback,
    );
  }

  // 13. PUBLISH RESULT
  @Post("exam/publish")
  async publishResult(
    @Body()
    body: {
      studentId: number;
      examName: string;
      score: number;
      maxScore: number;
    },
  ) {
    return await this.userService.publishExamResult(body);
  }

  // 14. GET RESULTS (For Student Dashboard)
  @Get("student/:id/results")
  async getResults(@Param("id") id: string) {
    return await this.userService.getStudentResults(Number(id));
  }

  // 15. BULK PUBLISH ROUTE
  @Post("exam/publish-bulk")
  async publishBulk(@Body() body: { results: any[] }) {
    return await this.userService.publishBulkResults(body.results);
  }

  // 16. ADMIN RESULTS ROUTE
  @Get("admin/results")
  async getAllExamResults() {
    return await this.userService.getAllExamResults();
  }

  // ==========================================
  // NEW LMS ROUTES (COURSE BUILDER)
  // ==========================================

  // 17. GET ALL COURSES (Student Portal)
  // 1. GET ALL COURSES (Powers the Student Dashboard Catalog)
  @Get("api/courses")
  async getAllCourses() {
    return await this.prisma.course.findMany({
      include: {
        modules: {
          include: { lessons: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // 2. GET ONE COURSE (Powers the Course Player)
  @Get("api/courses/:id")
  async getOneCourse(@Param("id") id: string) {
    return await this.prisma.course.findUnique({
      where: { id: id },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });
  }

  // 18. CREATE NEW COURSE (Teacher Builder)
  @Post("api/courses")
  async createCourse(@Body() body: any) {
    // This tells Prisma to create the Course, the Module, and the Lesson all at once!
    return await this.prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        thumbnail:
          body.thumbnail ||
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
        modules: {
          create: body.modules.map((mod: any) => ({
            title: mod.title,
            lessons: {
              create: mod.lessons.map((lesson: any) => ({
                title: lesson.title,
                videoUrl: lesson.videoUrl,
              })),
            },
          })),
        },
      },
    });
  }

  // 19. ENROLL IN A COURSE
  @Post("api/courses/:courseId/enroll")
  async enrollCourse(
    @Param("courseId") courseId: string,
    @Body() body: { userId: number },
  ) {
    return await this.prisma.enrollment.create({
      data: { courseId, userId: body.userId },
    });
  }

  // 20. GET STUDENT'S ENROLLED COURSES & PROGRESS
  @Get("api/students/:userId/learning")
  async getStudentLearning(@Param("userId") userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: Number(userId) },
      include: {
        course: {
          include: { modules: { include: { lessons: true } } },
        },
      },
    });

    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId: Number(userId) },
    });

    return { enrollments, progress };
  }

  // 21. MARK LESSON AS COMPLETE
  @Post("api/progress/complete")
  async completeLesson(@Body() body: { userId: number; lessonId: string }) {
    return await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: body.userId, lessonId: body.lessonId },
      },
      update: { isCompleted: true },
      create: {
        userId: body.userId,
        lessonId: body.lessonId,
        isCompleted: true,
      },
    });
  }

  // 22. LESSON COMMENTS
  @Get("api/lessons/:lessonId/comments")
  async getComments(@Param("lessonId") lessonId: string) {
    const data = await this.prisma.comment.findMany({
      where: { lessonId },
      orderBy: { createdAt: "desc" },
    });
    return data || []; // This ensures you ALWAYS return an array
  }

  // 23. POST A COMMENT
  @Post("api/lessons/:lessonId/comments")
  async postComment(@Param("lessonId") lessonId: string, @Body() body: any) {
    return await this.prisma.comment.create({
      data: {
        text: body.text,
        userName: body.userName,
        userId: body.userId,
        lessonId: lessonId,
      },
    });
  }
  // 24. STUDENT ACTIVITY FEED
  @Get("api/students/:userId/activity")
  async getStudentActivity(@Param("userId") userId: string) {
    const uid = Number(userId);

    // 1. Fetch recent course enrollments
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      include: { course: true },
      take: 2,
    });

    // 2. Fetch recently completed lessons
    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId: uid },
      orderBy: { updatedAt: "desc" },
      take: 3,
    });

    // 3. Combine, format, and sort by date
    const activity = [
      ...enrollments.map((e) => ({
        type: "enroll",
        title: `Enrolled in ${e.course.title}`,
        date: e.createdAt,
      })),
      ...progress.map((p) => ({
        type: "progress",
        title: "Completed a lesson",
        date: p.updatedAt,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return activity;
  }

  // ==========================================
  // COURSE EDIT / DELETE (PUT/DELETE)
  // ==========================================

  // 25. UPDATE COURSE
  @Put("api/courses/:courseId")
  @UseGuards(JwtAuthGuard)
  async updateCourse(
    @Param("courseId") courseId: string,
    @Body() body: CreateCourseDto,
    @Req() req: any,
  ) {
    // Check if user is teacher/admin
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      throw new HttpException("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new HttpException("Course not found", HttpStatus.NOT_FOUND);
    }

    return await this.prisma.course.update({
      where: { id: courseId },
      data: {
        title: body.name,
        description: body.description,
        thumbnail: body.image,
      },
      include: {
        modules: { include: { lessons: true } },
      },
    });
  }

  // 26. DELETE COURSE (Cascade deletes modules & lessons)
  @Delete("api/courses/:courseId")
  @UseGuards(JwtAuthGuard)
  async deleteCourse(@Param("courseId") courseId: string, @Req() req: any) {
    // Check if user is teacher/admin
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      throw new HttpException("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { lessons: true } } },
    });

    if (!course) {
      throw new HttpException("Course not found", HttpStatus.NOT_FOUND);
    }

    // Cascade delete: lessons â†’ modules â†’ course
    return await this.prisma.course.delete({
      where: { id: courseId },
    });
  }

  // ==========================================
  // DIRECT MESSAGING
  // ==========================================

  // 27. GET MESSAGE THREADS (All conversations)
  @Get("api/messages/threads")
  @UseGuards(JwtAuthGuard)
  async getMessageThreads(@Req() req: any) {
    return await this.messageService.getMessageThreads(req.user.id);
  }

  // 28. GET MESSAGES WITH SPECIFIC USER
  @Get("api/messages/thread/:userId")
  @UseGuards(JwtAuthGuard)
  async getThreadWithUser(@Param("userId") userId: string, @Req() req: any) {
    return await this.messageService.getThreadWithUser(
      req.user.id,
      Number(userId),
    );
  }

  // 29. SEND MESSAGE
  @Post("api/messages/send")
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Body() body: { recipientId: number; content: string },
    @Req() req: any,
  ) {
    // 1. Tell TypeScript to treat this as 'any' to bypass the strict 'never' error
    const message: any = await this.messageService.sendMessage(
      req.user.id,
      body.recipientId,
      body.content,
    );

    // 2. Safety check: Only try to send an email if the recipient data exists
    if (message && message.recipient) {
      await this.emailService
        .sendDirectMessageEmail(
          message.recipient.email,
          message.recipient.name,
          req.user.name,
          body.content.substring(0, 100),
        )
        .catch((err) =>
          console.log("Email send error (non-blocking):", err.message),
        );
    }

    return message;
  }

  // 30. MARK MESSAGE AS READ
  @Put("api/messages/:messageId/read")
  @UseGuards(JwtAuthGuard)
  async markMessageAsRead(@Param("messageId") messageId: string) {
    return await this.messageService.markAsRead(Number(messageId));
  }

  // 31. GET UNREAD MESSAGE COUNT
  @Get("api/messages/unread/count")
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Req() req: any) {
    const count = await this.messageService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }
}
