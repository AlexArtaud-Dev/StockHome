import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomEntity } from './room.entity';

export type HouseholdType =
  | 'house'
  | 'flat'
  | 'apartment'
  | 'studio'
  | 'garage'
  | 'office'
  | 'storage'
  | 'other';

@Entity('household')
export class HouseholdEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  ownerId!: string | null;

  @Column({ type: 'text', default: 'other' })
  type!: HouseholdType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => RoomEntity, (room) => room.household)
  rooms!: RoomEntity[];
}
