import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContainerEntity } from '../../database/entities/container.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { ContainerController } from './container.controller';
import { ContainerService } from './container.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContainerEntity, RoomEntity])],
  controllers: [ContainerController],
  providers: [ContainerService],
  exports: [ContainerService],
})
export class ContainerModule {}
