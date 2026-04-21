import { UserService } from './user.service';
import { AiService } from './ai/ai.service';
export declare class AppController {
    private readonly userService;
    private readonly aiService;
    constructor(userService: UserService, aiService: AiService);
    login(body: {
        email: string;
        pass: string;
    }): Promise<{
        id: number;
        email: string;
        name: string;
        role: string;
        branch: string | null;
    }>;
    register(body: any): Promise<{
        id: number;
        email: string;
        password: string;
        name: string;
        role: string;
        branch: string | null;
    }>;
    getDashboardData(id: string): Promise<{
        assignments: {
            id: number;
            title: string;
            subject: string;
            dueDate: Date;
            status: string;
            submissionUrl: string | null;
            grade: string | null;
            feedback: string | null;
            userId: number;
        }[];
        attendance: {
            id: number;
            date: Date;
            status: string;
            userId: number;
        }[];
    } & {
        id: number;
        email: string;
        password: string;
        name: string;
        role: string;
        branch: string | null;
    }>;
    getClassList(): Promise<{
        id: number;
        email: string;
        name: string;
        branch: string;
        assignments: {
            id: number;
            title: string;
            subject: string;
            dueDate: Date;
            status: string;
            submissionUrl: string | null;
            grade: string | null;
            feedback: string | null;
            userId: number;
        }[];
    }[]>;
    handleChat(body: {
        message: string;
        role?: string;
    }): Promise<{
        reply: string;
    }>;
    markAttendance(body: {
        studentId: number;
        status: string;
        date: string;
    }): Promise<{
        id: number;
        date: Date;
        status: string;
        userId: number;
    }>;
    createAssignment(body: any): Promise<{
        id: number;
        title: string;
        subject: string;
        dueDate: Date;
        status: string;
        submissionUrl: string | null;
        grade: string | null;
        feedback: string | null;
        userId: number;
    }>;
    submitAssignment(id: string, file: any): Promise<{
        id: number;
        title: string;
        subject: string;
        dueDate: Date;
        status: string;
        submissionUrl: string | null;
        grade: string | null;
        feedback: string | null;
        userId: number;
    }>;
    getStats(): Promise<{
        totalStudents: number;
        totalTeachers: number;
        totalAssignments: number;
        recentUsers: {
            id: number;
            email: string;
            name: string;
            role: string;
        }[];
    }>;
    getAllUsers(): Promise<{
        id: number;
        email: string;
        name: string;
        role: string;
    }[]>;
    deleteUser(id: string): Promise<{
        id: number;
        email: string;
        password: string;
        name: string;
        role: string;
        branch: string | null;
    }>;
    gradeAssignment(id: string, body: {
        grade: string;
        feedback: string;
    }): Promise<{
        id: number;
        title: string;
        subject: string;
        dueDate: Date;
        status: string;
        submissionUrl: string | null;
        grade: string | null;
        feedback: string | null;
        userId: number;
    }>;
    publishResult(body: {
        studentId: number;
        examName: string;
        score: number;
        maxScore: number;
    }): Promise<{
        id: number;
        examName: string;
        score: number;
        maxScore: number;
        date: Date;
        studentId: number;
    }>;
    getResults(id: string): Promise<{
        id: number;
        examName: string;
        score: number;
        maxScore: number;
        date: Date;
        studentId: number;
    }[]>;
    publishBulk(body: {
        results: any[];
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getAllExamResults(): Promise<({
        student: {
            email: string;
            name: string;
        };
    } & {
        id: number;
        examName: string;
        score: number;
        maxScore: number;
        date: Date;
        studentId: number;
    })[]>;
}
