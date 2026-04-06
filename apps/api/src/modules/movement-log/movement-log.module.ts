import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementLogEntity } from '../../database/entities/movement-log.entity';
import { MovementLogController } from './movement-log.controller';
import { MovementLogService } from './movement-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([MovementLogEntity])],
  controllers: [MovementLogController],
  providers: [MovementLogService],
})
export class MovementLogModule {}
