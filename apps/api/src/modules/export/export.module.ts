import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdEntity } from '../../database/entities/household.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { ContainerEntity } from '../../database/entities/container.entity';
import { ItemEntity } from '../../database/entities/item.entity';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [TypeOrmModule.forFeature([HouseholdEntity, RoomEntity, ContainerEntity, ItemEntity])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
