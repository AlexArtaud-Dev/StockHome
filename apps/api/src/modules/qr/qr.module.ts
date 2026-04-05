import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContainerEntity } from '../../database/entities/container.entity';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContainerEntity])],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
