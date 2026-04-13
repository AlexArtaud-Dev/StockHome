import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { Fts5Service } from './fts5.service';
import { HouseholdEntity } from './entities/household.entity';
import { HouseholdMemberEntity } from './entities/household-member.entity';
import { HouseholdInvitationEntity } from './entities/household-invitation.entity';
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
      useFactory: () => {
        // Resolve DB path to absolute so it never depends on cwd
        // __dirname in dist = apps/api/dist/database → ../../../ = repo root
        const rawDbPath = process.env['DB_PATH'] ?? './data/stockhome.db';
        const database = path.isAbsolute(rawDbPath)
          ? rawDbPath
          : path.resolve(__dirname, '../../../', rawDbPath);
        return ({
        type: 'better-sqlite3',
        database,
        entities: [
          HouseholdEntity,
          HouseholdMemberEntity,
          HouseholdInvitationEntity,
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
        });
      },
    }),
  ],
  providers: [Fts5Service],
  exports: [Fts5Service],
})
export class DatabaseModule {}
