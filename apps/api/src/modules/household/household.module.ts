import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdEntity } from '../../database/entities/household.entity';
import { HouseholdMemberEntity } from '../../database/entities/household-member.entity';
import { HouseholdInvitationEntity } from '../../database/entities/household-invitation.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { HouseholdController, InvitationController } from './household.controller';
import { HouseholdService } from './household.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HouseholdEntity,
      HouseholdMemberEntity,
      HouseholdInvitationEntity,
      UserEntity,
    ]),
    EmailModule,
  ],
  controllers: [HouseholdController, InvitationController],
  providers: [HouseholdService],
  exports: [HouseholdService],
})
export class HouseholdModule {}
