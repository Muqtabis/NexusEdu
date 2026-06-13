import { Controller, Post, Get, Delete, Body, Param, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UserService } from './user.service';
import { AiService } from './ai/ai.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService
  ) {}

  // 1. LOGIN
  // 1. LOGIN
  @Post('login')
  async login(@Body() body: { email: string; pass?: string; password?: string }) {
    // This safely grabs the password whether React calls it 'pass' or 'password'
    const actualPassword = body.password || body.pass;
    
    const user = await this.userService.validateUser(body.email, actualPassword);
    if (!user) throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    return user;
  }

  // 2. REGISTER
  @Post('register')
  async register(@Body() body: any) {
    try {
      return await this.userService.createUser(body);
    } catch (error) {
      throw new HttpException('Email already registered', HttpStatus.BAD_REQUEST);
    }
  }

  // 3. DASHBOARD DATA
  @Get('dashboard/:id')
  async getDashboardData(@Param('id') id: string) {
    return await this.userService.getUserById(parseInt(id));
  }

  // 4. TEACHER CLASS LIST
  @Get('teacher/class')
  async getClassList() {
    return await this.userService.getClassList();
  }

  // 5. AI CHAT
  @Post('chat')
  async handleChat(@Body() body: { message: string; role?: string }) {
    return await this.aiService.chat(body.message, body.role);
  }

  // 6. SAVE ATTENDANCE
  @Post('attendance')
  async markAttendance(@Body() body: { studentId: number; status: string; date: string }) {
    return await this.userService.saveAttendance(body);
  }

  // 7. CREATE ASSIGNMENT
  @Post('assignment')
  async createAssignment(@Body() body: any) {
    return await this.userService.createAssignment(body);
  }

  // 8. SUBMIT ASSIGNMENT (With File Upload!)
  @Post('assignment/:id/submit')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads', // Files will be saved here
      filename: (req, file, cb) => {
        // Generate a random name to prevent duplicates
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async submitAssignment(@Param('id') id: string, @UploadedFile() file: any) {
    console.log(`File uploaded:`, file?.filename);
    
    // Create the full URL so the frontend can download it later
    const fileUrl = file ? `http://localhost:4000/uploads/${file.filename}` : undefined;
    
    return await this.userService.submitAssignment(Number(id), fileUrl);
  }

  // 9. ADMIN STATS
  @Get('admin/stats')
  async getStats() {
    return await this.userService.getAdminStats();
  }

  // 10. LIST ALL USERS
  @Get('admin/users')
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  // 11. DELETE USER
  @Delete('admin/user/:id')
  async deleteUser(@Param('id') id: string) {
    return await this.userService.deleteUser(Number(id));
  }

  // 12. Grade Assignment Route
  @Post('assignment/:id/grade')
  async gradeAssignment(@Param('id') id: string, @Body() body: { grade: string; feedback: string }) {
    return await this.userService.gradeAssignment(Number(id), body.grade, body.feedback);
  }

  // 13. PUBLISH RESULT
  @Post('exam/publish')
  async publishResult(@Body() body: { studentId: number; examName: string; score: number; maxScore: number }) {
    return await this.userService.publishExamResult(body);
  }

  // 14. GET RESULTS (For Student Dashboard)
  @Get('student/:id/results')
  async getResults(@Param('id') id: string) {
    return await this.userService.getStudentResults(Number(id));
  }

  // 15. BULK PUBLISH ROUTE
  @Post('exam/publish-bulk')
  async publishBulk(@Body() body: { results: any[] }) {
    return await this.userService.publishBulkResults(body.results);
  }

  // 16. ADMIN RESULTS ROUTE
  @Get('admin/results')
  async getAllExamResults() {
    return await this.userService.getAllExamResults();
  }

  // ==========================================
  // NEW LMS ROUTES (COURSE BUILDER)
  // ==========================================

  // 17. GET ALL COURSES (Student Portal)
// 1. GET ALL COURSES (Powers the Student Dashboard Catalog)
  @Get('api/courses')
  async getAllCourses() {
    return await this.prisma.course.findMany({
      include: {
        modules: {
          include: { lessons: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 2. GET ONE COURSE (Powers the Course Player)
  @Get('api/courses/:id')
  async getOneCourse(@Param('id') id: string) {
    return await this.prisma.course.findUnique({
      where: { id: id },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    });
  }
  // 18. CREATE NEW COURSE (Teacher Builder)
  @Post('api/courses')
  async createCourse(@Body() body: any) {
    // This tells Prisma to create the Course, the Module, and the Lesson all at once!
    return await this.prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        thumbnail: body.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
        modules: {
          create: body.modules.map((mod: any) => ({
            title: mod.title,
            lessons: {
              create: mod.lessons.map((lesson: any) => ({
                title: lesson.title,
                videoUrl: lesson.videoUrl
              }))
            }
          }))
        }
      }
    });
  }
  // 19. ENROLL IN A COURSE
  @Post('api/courses/:courseId/enroll')
  async enrollCourse(@Param('courseId') courseId: string, @Body() body: { userId: number }) {
    return await this.prisma.enrollment.create({
      data: { courseId, userId: body.userId }
    });
  }

  // 20. GET STUDENT'S ENROLLED COURSES & PROGRESS
  @Get('api/students/:userId/learning')
  async getStudentLearning(@Param('userId') userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: Number(userId) },
      include: { 
        course: { 
          include: { modules: { include: { lessons: true } } } 
        } 
      }
    });

    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId: Number(userId) }
    });

    return { enrollments, progress };
  }

  // 21. MARK LESSON AS COMPLETE
  @Post('api/progress/complete')
  async completeLesson(@Body() body: { userId: number; lessonId: string }) {
    return await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: body.userId, lessonId: body.lessonId } },
      update: { isCompleted: true },
      create: { userId: body.userId, lessonId: body.lessonId, isCompleted: true }
    });
  }
  // 22. LESSON COMMENTS
  @Get('api/lessons/:lessonId/comments')
  async getComments(@Param('lessonId') lessonId: string) {
    const data = await this.prisma.comment.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'desc' }
    });
    return data || []; // This ensures you ALWAYS return an array
  }
// 23. POST A COMMENT
  @Post('api/lessons/:lessonId/comments')
  async postComment(@Param('lessonId') lessonId: string, @Body() body: any) {
    return await this.prisma.comment.create({
      data: {
        text: body.text,
        userName: body.userName,
        userId: body.userId,
        lessonId: lessonId
      }
    });
  }
  // 24. STUDENT ACTIVITY FEED
  @Get('api/students/:userId/activity')
  async getStudentActivity(@Param('userId') userId: string) {
    const uid = Number(userId);
    
    // 1. Fetch recent course enrollments
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: uid },
      orderBy: { createdAt: 'desc' },
      include: { course: true },
      take: 2
    });

    // 2. Fetch recently completed lessons
    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId: uid },
      orderBy: { updatedAt: 'desc' },
      take: 3
    });

    // 3. Combine, format, and sort by date
    const activity = [
      ...enrollments.map(e => ({ 
        type: 'enroll', 
        title: `Enrolled in ${e.course.title}`, 
        date: e.createdAt 
      })),
      ...progress.map(p => ({ 
        type: 'progress', 
        title: 'Completed a lesson', 
        date: p.updatedAt 
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return activity;
  }
}