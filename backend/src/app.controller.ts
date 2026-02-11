import { Controller, Post, Get, Delete, Body, Param, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UserService } from './user.service';
import { AiService } from './ai/ai.service';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly aiService: AiService
  ) {}

  // 1. LOGIN
  @Post('login')
  async login(@Body() body: { email: string; pass: string }) {
    const user = await this.userService.validateUser(body.email, body.pass);
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
}