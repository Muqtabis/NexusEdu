export declare class UserService {
    getUserById(id: number): Promise<{
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
    createUser(data: any): Promise<{
        id: number;
        email: string;
        password: string;
        name: string;
        role: string;
        branch: string | null;
    }>;
    validateUser(email: string, pass: string): Promise<{
        id: number;
        email: string;
        name: string;
        role: string;
        branch: string | null;
    }>;
    saveAttendance(data: {
        studentId: number;
        status: string;
        date: string;
    }): Promise<{
        id: number;
        date: Date;
        status: string;
        userId: number;
    }>;
    createAssignment(data: {
        title: string;
        subject: string;
        dueDate: string;
        studentId: number;
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
    submitAssignment(assignmentId: number, fileUrl?: string): Promise<{
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
    gradeAssignment(assignmentId: number, grade: string, feedback: string): Promise<{
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
    getAdminStats(): Promise<{
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
    deleteUser(id: number): Promise<{
        id: number;
        email: string;
        password: string;
        name: string;
        role: string;
        branch: string | null;
    }>;
    publishExamResult(data: {
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
    getStudentResults(studentId: number): Promise<{
        id: number;
        examName: string;
        score: number;
        maxScore: number;
        date: Date;
        studentId: number;
    }[]>;
    publishBulkResults(results: {
        studentId: number;
        examName: string;
        score: number;
        maxScore: number;
    }[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
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
