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

  @CreateDateColumn()
  createdAt!: Date;
}
