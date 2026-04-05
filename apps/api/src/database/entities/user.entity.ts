import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HouseholdEntity } from './household.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  householdId!: string;

  @Column({ type: 'text', unique: true })
  username!: string;

  @Column({ type: 'text' })
  passwordHash!: string;

  @Column({ type: 'text', nullable: true })
  displayName!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => HouseholdEntity, (household) => household.users)
  household!: HouseholdEntity;
}
