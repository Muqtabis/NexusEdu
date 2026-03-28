import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. ENABLE CORS
  // This allows your React frontend (on Vercel) to talk to this API.
  app.enableCors({
   origin: [
      'https://nexusedu-eta.vercel.app', 
      'http://localhost:5173'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. DYNAMIC PORT BINDING
  // Railway and other hosts provide a PORT environment variable.
  // We also bind to '0.0.0.0' so the service is reachable externally.
  const port = process.env.PORT || 4000;
  
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Server is running on: http://0.0.0.0:${port}`);
  logger.log(`📡 Accepting requests from frontend origins`);
}
bootstrap();