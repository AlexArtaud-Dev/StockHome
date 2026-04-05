import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemEntity } from '../../database/entities/item.entity';
import { CategoryEntity } from '../../database/entities/category.entity';
import { TagEntity } from '../../database/entities/tag.entity';
import { MovementLogEntity } from '../../database/entities/movement-log.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ItemEntity,
      CategoryEntity,
      TagEntity,
      MovementLogEntity,
      RoomEntity,
    ]),
  ],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
