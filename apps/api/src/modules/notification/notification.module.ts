import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { ItemEntity } from '../../database/entities/item.entity';
import { HouseholdMemberEntity } from '../../database/entities/household-member.entity';
import { EmailModule } from '../email/email.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ItemEntity, HouseholdMemberEntity]), EmailModule],
  providers: [NotificationService],
})
export class NotificationModule {}
