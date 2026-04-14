import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../database/entities/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly emailService: EmailService,
  ) {}

  async listUsers(search?: string) {
    const users = search
      ? await this.userRepo.find({
          where: [
            { email: Like(`%${search}%`) },
            { username: Like(`%${search}%`) },
            { firstName: Like(`%${search}%`) },
            { lastName: Like(`%${search}%`) },
          ],
          order: { createdAt: 'DESC' },
          take: 100,
        })
      : await this.userRepo.find({
          order: { createdAt: 'DESC' },
          take: 100,
        });

    return users.map(this.toAdminDto);
  }

  async ban(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    user.isBanned = true;
    await this.userRepo.save(user);
    return this.toAdminDto(user);
  }

  async unban(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    user.isBanned = false;
    await this.userRepo.save(user);
    return this.toAdminDto(user);
  }

  async promote(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    user.isAdmin = true;
    await this.userRepo.save(user);
    return this.toAdminDto(user);
  }

  async demote(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    user.isAdmin = false;
    await this.userRepo.save(user);
    return this.toAdminDto(user);
  }

  async resetPassword(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    await this.userRepo.save(user);

    if (user.email) {
      await this.emailService.sendAdminPasswordEmail(user.email, password, true);
    }

    return { message: `Password reset. A new temporary password has been sent to ${user.email ?? 'the user'}.` };
  }

  async resendConfirmation(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified || !user.email) {
      return { message: 'User is already verified or has no email' };
    }

    const token = uuidv4();
    user.emailVerificationToken = token;
    user.emailVerificationTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
    user.lastVerificationSentAt = new Date();
    await this.userRepo.save(user);

    await this.emailService.sendVerificationEmail(user.email, token);

    return { message: 'Confirmation email sent' };
  }

  private toAdminDto(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      isEmailVerified: user.isEmailVerified,
      isBanned: user.isBanned,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
