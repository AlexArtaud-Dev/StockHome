import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

@Entity('household_invitation')
export class HouseholdInvitationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  householdId!: string;

  @Column({ type: 'text' })
  invitedEmail!: string;

  @Column({ type: 'text' })
  invitedByUserId!: string;

  @Column({ type: 'text', unique: true })
  token!: string;

  @Column({ type: 'text', default: 'pending' })
  status!: InvitationStatus;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
