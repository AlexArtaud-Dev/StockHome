import { Module } from '@nestjs/common';
import { UploadController, UploadServeController } from './upload.controller';

@Module({
  controllers: [UploadController, UploadServeController],
})
export class UploadModule {}
