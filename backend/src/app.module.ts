import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppController } from "./app.controller";
import { UserService } from "./user.service";
import { AiService } from "./ai/ai.service";
import { PrismaService } from "./prisma.service";
import { AuthModule } from "./auth/auth.module";
import { EmailService } from "./email/email.service";
import { MessageService } from "./message.service";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "uploads"),
      serveRoot: "/uploads",
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    UserService,
    AiService,
    EmailService,
    MessageService,
  ],
  exports: [PrismaService],
})
export class AppModule {}
