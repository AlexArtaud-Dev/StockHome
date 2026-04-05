import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdEntity } from './entities/household.entity';
import { UserEntity } from './entities/user.entity';
import { RoomEntity } from './entities/room.entity';
import { ContainerEntity } from './entities/container.entity';
import { ItemEntity } from './entities/item.entity';
import { CategoryEntity } from './entities/category.entity';
import { TagEntity } from './entities/tag.entity';
import { StockRuleEntity } from './entities/stock-rule.entity';
import { MovementLogEntity } from './entities/movement-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'better-sqlite3',
        database: process.env['DB_PATH'] ?? './data/stockhome.db',
        entities: [
          HouseholdEntity,
          UserEntity,
          RoomEntity,
          ContainerEntity,
          ItemEntity,
          CategoryEntity,
          TagEntity,
          StockRuleEntity,
          MovementLogEntity,
        ],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
