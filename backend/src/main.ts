import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser = require("cookie-parser");
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // CORS Fix: Automatically allows any Vercel domain and localhost
  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || origin.includes('localhost')) {
        return callback(null, true); // Allow local development
      }
      if (origin.includes('vercel.app')) {
        return callback(null, true); // Allow all Vercel deployments
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
    }),
  );

  // Render Fix: Uses the cloud provider's assigned port if available
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}

bootstrap();