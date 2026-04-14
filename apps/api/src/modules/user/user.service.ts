import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { UserEntity } from '../../database/entities/user.entity';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class UpdateNotificationsDto {
  @IsBoolean()
  @IsOptional()
  notifyExpiryEnabled?: boolean;

  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  notifyExpiryDays?: number;

  @IsBoolean()
  @IsOptional()
  notifyWeeklySummary?: boolean;

  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  weeklyDigestDayOfWeek?: number;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findOne(id: string) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return this.toDto(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      user.displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.displayName;
    }
    await this.userRepo.save(user);
    return this.toDto(user);
  }

  async updateNotifications(id: string, dto: UpdateNotificationsDto) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    if (dto.notifyExpiryEnabled !== undefined) user.notifyExpiryEnabled = dto.notifyExpiryEnabled;
    if (dto.notifyExpiryDays !== undefined) user.notifyExpiryDays = dto.notifyExpiryDays;
    if (dto.notifyWeeklySummary !== undefined) user.notifyWeeklySummary = dto.notifyWeeklySummary;
    if (dto.weeklyDigestDayOfWeek !== undefined) user.weeklyDigestDayOfWeek = dto.weeklyDigestDayOfWeek;

    await this.userRepo.save(user);
    return this.toDto(user);
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);

    return { message: 'Password changed successfully' };
  }

  private toDto(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      isEmailVerified: user.isEmailVerified,
      notifyExpiryEnabled: user.notifyExpiryEnabled,
      notifyExpiryDays: user.notifyExpiryDays,
      notifyWeeklySummary: user.notifyWeeklySummary,
      weeklyDigestDayOfWeek: user.weeklyDigestDayOfWeek,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
