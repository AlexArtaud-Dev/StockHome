import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Kept for backward-compat — populated at runtime by JwtStrategy from X-Household-Id header
  @Column({ type: 'text', nullable: true })
  householdId!: string | null;

  @Column({ type: 'text', unique: true })
  username!: string;

  @Column({ type: 'text', unique: true, nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  firstName!: string | null;

  @Column({ type: 'text', nullable: true })
  lastName!: string | null;

  @Column({ type: 'text', nullable: true })
  displayName!: string | null;

  @Column({ type: 'text' })
  passwordHash!: string;

  @Column({ type: 'boolean', default: false })
  isAdmin!: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  isBanned!: boolean;

  @Column({ type: 'text', nullable: true })
  emailVerificationToken!: string | null;

  @Column({ type: 'datetime', nullable: true })
  emailVerificationTokenExpiry!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastVerificationSentAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  notifyExpiryEnabled!: boolean;

  @Column({ type: 'integer', default: 7 })
  notifyExpiryDays!: number;

  @Column({ type: 'boolean', default: false })
  notifyWeeklySummary!: boolean;

  @Column({ type: 'integer', default: 1 })
  weeklyDigestDayOfWeek!: number; // 0=Sun … 6=Sat

  @CreateDateColumn()
  createdAt!: Date;
}
