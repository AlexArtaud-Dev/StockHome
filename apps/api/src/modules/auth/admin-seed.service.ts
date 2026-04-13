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

  async onApplicationBootstrap(): Promise<void> {
    const adminEmail = process.env['ADMIN_EMAIL'];
    if (!adminEmail) {
      return;
    }

    const existing = await this.userRepo.findOneBy({ email: adminEmail.toLowerCase() });
    if (existing) {
      // Ensure the existing account is an admin
      if (!existing.isAdmin) {
        existing.isAdmin = true;
        await this.userRepo.save(existing);
        this.logger.log(`Promoted existing user ${adminEmail} to admin`);
      }
      return;
    }

    // Generate a random password
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

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
    this.logger.log('Change this password after first login!');
    this.logger.log('='.repeat(60));
  }
}
