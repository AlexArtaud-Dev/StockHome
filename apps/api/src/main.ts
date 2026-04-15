import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Resolve .env from monorepo root regardless of cwd or launch method
// dist/main.js lives at apps/api/dist/main.js  → ../../../ = repo root
// src/main.ts  via ts-node lives at apps/api/src/main.ts → ../../ = repo root
const envPath = path.resolve(__dirname, '../../../.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
  // Fallback: try two levels up (ts-node) then cwd
  dotenv.config({ path: path.resolve(__dirname, '../../.env') }) ||
  dotenv.config();
}

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  // Ensure data directories exist
  const dbDir = path.dirname(process.env['DB_PATH'] ?? './data/stockhome.db');
  const uploadDir = process.env['UPLOAD_DIR'] ?? './data/uploads';
  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  // Serve uploaded files at /uploads/<filename>
  app.useStaticAssets(path.resolve(uploadDir), { prefix: '/uploads' });

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
