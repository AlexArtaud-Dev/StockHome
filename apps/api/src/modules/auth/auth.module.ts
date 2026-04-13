import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AdminSeedService } from './admin-seed.service';
import { UserEntity } from '../../database/entities/user.entity';
import { HouseholdMemberEntity } from '../../database/entities/household-member.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([UserEntity, HouseholdMemberEntity]),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminSeedService],
  exports: [AuthService],
})
export class AuthModule {}
