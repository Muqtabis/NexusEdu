import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { UserService } from './user.service';
import { AiService } from './ai/ai.service';

@Module({
  imports: [
    // This allows access to files at http://localhost:4000/uploads/filename.pdf
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [UserService, AiService],
})
export class AppModule {}