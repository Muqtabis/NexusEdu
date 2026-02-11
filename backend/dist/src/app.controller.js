"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const user_service_1 = require("./user.service");
const ai_service_1 = require("./ai/ai.service");
let AppController = class AppController {
    constructor(userService, aiService) {
        this.userService = userService;
        this.aiService = aiService;
    }
    async login(body) {
        const user = await this.userService.validateUser(body.email, body.pass);
        if (!user)
            throw new common_1.HttpException('Invalid email or password', common_1.HttpStatus.UNAUTHORIZED);
        return user;
    }
    async register(body) {
        try {
            return await this.userService.createUser(body);
        }
        catch (error) {
            throw new common_1.HttpException('Email already registered', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getDashboardData(id) {
        return await this.userService.getUserById(parseInt(id));
    }
    async getClassList() {
        return await this.userService.getClassList();
    }
    async handleChat(body) {
        return await this.aiService.chat(body.message, body.role);
    }
    async markAttendance(body) {
        return await this.userService.saveAttendance(body);
    }
    async createAssignment(body) {
        return await this.userService.createAssignment(body);
    }
    async submitAssignment(id, file) {
        console.log(`File uploaded:`, file === null || file === void 0 ? void 0 : file.filename);
        const fileUrl = file ? `http://localhost:4000/uploads/${file.filename}` : undefined;
        return await this.userService.submitAssignment(Number(id), fileUrl);
    }
    async getStats() {
        return await this.userService.getAdminStats();
    }
    async getAllUsers() {
        return await this.userService.getAllUsers();
    }
    async deleteUser(id) {
        return await this.userService.deleteUser(Number(id));
    }
    async gradeAssignment(id, body) {
        return await this.userService.gradeAssignment(Number(id), body.grade, body.feedback);
    }
    async publishResult(body) {
        return await this.userService.publishExamResult(body);
    }
    async getResults(id) {
        return await this.userService.getStudentResults(Number(id));
    }
    async publishBulk(body) {
        return await this.userService.publishBulkResults(body.results);
    }
    async getAllExamResults() {
        return await this.userService.getAllExamResults();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('dashboard/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getDashboardData", null);
__decorate([
    (0, common_1.Get)('teacher/class'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getClassList", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "handleChat", null);
__decorate([
    (0, common_1.Post)('attendance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "markAttendance", null);
__decorate([
    (0, common_1.Post)('assignment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAssignment", null);
__decorate([
    (0, common_1.Post)('assignment/:id/submit'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "submitAssignment", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('admin/users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Delete)('admin/user/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('assignment/:id/grade'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "gradeAssignment", null);
__decorate([
    (0, common_1.Post)('exam/publish'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "publishResult", null);
__decorate([
    (0, common_1.Get)('student/:id/results'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getResults", null);
__decorate([
    (0, common_1.Post)('exam/publish-bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "publishBulk", null);
__decorate([
    (0, common_1.Get)('admin/results'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAllExamResults", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        ai_service_1.AiService])
], AppController);
//# sourceMappingURL=app.controller.js.map