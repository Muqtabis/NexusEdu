import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { UserService } from './user.service';
import { AiService } from './ai/ai.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { EmailService } from './email/email.service';
import { MessageService } from './message.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [PrismaService, UserService, AiService, EmailService, MessageService, ChatGateway],
  exports: [PrismaService],
})
export class AppModule {}