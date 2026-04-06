import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Ensure data directories exist
  const dbDir = path.dirname(process.env['DB_PATH'] ?? './data/stockhome.db');
  const uploadDir = process.env['UPLOAD_DIR'] ?? './data/uploads';
  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap().catch(console.error);
