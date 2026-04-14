import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { ItemEntity } from '../../database/entities/item.entity';
import { HouseholdMemberEntity } from '../../database/entities/household-member.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ItemEntity) private readonly itemRepo: Repository<ItemEntity>,
    @InjectRepository(HouseholdMemberEntity) private readonly memberRepo: Repository<HouseholdMemberEntity>,
    private readonly emailService: EmailService,
  ) {}

  // Run daily at 08:00
  @Cron('0 8 * * *')
  async sendExpiryAlerts() {
    this.logger.log('Running expiry alert job');
    const users = await this.userRepo.find({ where: { notifyExpiryEnabled: true, isEmailVerified: true } });
    for (const user of users) {
      if (!user.email) continue;
      // Get all households this user is a member of
      const memberships = await this.memberRepo.find({ where: { userId: user.id } });
      const householdIds = memberships.map(m => m.householdId);
      if (householdIds.length === 0) continue;

      const cutoff = new Date(Date.now() + user.notifyExpiryDays * 24 * 60 * 60 * 1000);
      const allExpiring: ItemEntity[] = [];
      for (const hid of householdIds) {
        const items = await this.itemRepo
          .createQueryBuilder('i')
          .where('i.householdId = :hid', { hid })
          .andWhere('i.expiresAt IS NOT NULL')
          .andWhere('i.expiresAt <= :cutoff', { cutoff: cutoff.toISOString() })
          .andWhere('i.quantity > 0')
          .orderBy('i.expiresAt', 'ASC')
          .getMany();
        allExpiring.push(...items);
      }

      if (allExpiring.length === 0) continue;
      await this.emailService.sendExpiryAlertEmail(user.email, allExpiring, user.notifyExpiryDays);
    }
  }

  // Run daily at 09:00, check if it's a user's configured digest day
  @Cron('0 9 * * *')
  async sendWeeklySummary() {
    this.logger.log('Running weekly summary job');
    const todayDow = new Date().getDay(); // 0=Sun
    const users = await this.userRepo.find({
      where: { notifyWeeklySummary: true, weeklyDigestDayOfWeek: todayDow, isEmailVerified: true },
    });
    for (const user of users) {
      if (!user.email) continue;
      const memberships = await this.memberRepo.find({ where: { userId: user.id } });
      if (memberships.length === 0) continue;

      // Gather stats: total items, low stock items, expiring in 7 days
      const stats = { totalItems: 0, lowStock: 0, expiringSoon: 0 };
      for (const m of memberships) {
        const total = await this.itemRepo.count({ where: { householdId: m.householdId } });
        const cutoff7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const expiring = await this.itemRepo
          .createQueryBuilder('i')
          .where('i.householdId = :hid', { hid: m.householdId })
          .andWhere('i.expiresAt IS NOT NULL')
          .andWhere('i.expiresAt <= :cutoff', { cutoff: cutoff7.toISOString() })
          .andWhere('i.quantity > 0')
          .getCount();
        stats.totalItems += total;
        stats.expiringSoon += expiring;
      }

      await this.emailService.sendWeeklySummaryEmail(user.email, stats);
    }
  }
}
