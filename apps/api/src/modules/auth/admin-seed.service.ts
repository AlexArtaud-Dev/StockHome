import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async onApplicationBootstrap(): Promise<void> {
    const adminEmail = process.env['ADMIN_EMAIL'];
    if (!adminEmail) {
      return;
    }

    const firstLaunch = process.env['FIRST_LAUNCH'] === 'true';
    const existing = await this.userRepo.findOneBy({ email: adminEmail.toLowerCase() });

    if (existing) {
      if (firstLaunch) {
        // Reset password on first launch
        const password = this.generatePassword();
        existing.passwordHash = await bcrypt.hash(password, 12);
        existing.isAdmin = true;
        existing.isEmailVerified = true;
        existing.isBanned = false;
        await this.userRepo.save(existing);

        this.logger.log('='.repeat(60));
        this.logger.log('ADMIN PASSWORD RESET (FIRST_LAUNCH=true)');
        this.logger.log(`  Email   : ${adminEmail}`);
        this.logger.log(`  Password: ${password}`);
        this.logger.log('Set FIRST_LAUNCH=false after logging in!');
        this.logger.log('='.repeat(60));
      } else {
        // Just ensure admin flag is set
        if (!existing.isAdmin) {
          existing.isAdmin = true;
          await this.userRepo.save(existing);
          this.logger.log(`Promoted existing user ${adminEmail} to admin`);
        }
      }
      return;
    }

    // Account does not exist — create it regardless of FIRST_LAUNCH
    const password = this.generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({
      id: uuidv4(),
      email: adminEmail.toLowerCase(),
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin',
      username: 'admin',
      passwordHash,
      isAdmin: true,
      isEmailVerified: true,
      isBanned: false,
    });

    await this.userRepo.save(user);

    this.logger.log('='.repeat(60));
    this.logger.log('ADMIN ACCOUNT CREATED');
    this.logger.log(`  Email   : ${adminEmail}`);
    this.logger.log(`  Password: ${password}`);
    this.logger.log('Set FIRST_LAUNCH=false after logging in!');
    this.logger.log('='.repeat(60));
  }
}
