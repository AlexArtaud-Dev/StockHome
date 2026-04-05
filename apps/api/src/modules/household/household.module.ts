import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdEntity } from '../../database/entities/household.entity';
import { HouseholdController } from './household.controller';
import { HouseholdService } from './household.service';

@Module({
  imports: [TypeOrmModule.forFeature([HouseholdEntity])],
  controllers: [HouseholdController],
  providers: [HouseholdService],
})
export class HouseholdModule {}
