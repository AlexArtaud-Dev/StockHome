import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HouseholdEntity } from './household.entity';
import { ContainerEntity } from './container.entity';
import { ItemEntity } from './item.entity';

@Entity('room')
export class RoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  householdId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  icon!: string | null;

  @Column({ type: 'text', nullable: true })
  color!: string | null;

  @Column({ type: 'text', nullable: true })
  photoPath!: string | null;

  @Column({ type: 'integer', default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => HouseholdEntity, (household) => household.rooms)
  household!: HouseholdEntity;

  @OneToMany(() => ContainerEntity, (container) => container.room)
  containers!: ContainerEntity[];

  @OneToMany(() => ItemEntity, (item) => item.room)
  items!: ItemEntity[];
}
