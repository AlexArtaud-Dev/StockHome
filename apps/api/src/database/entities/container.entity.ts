import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomEntity } from './room.entity';
import { ItemEntity } from './item.entity';
import { ContainerType } from '@stockhome/shared';

@Entity('container')
export class ContainerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  roomId!: string;

  @Column({ type: 'text', nullable: true })
  parentContainerId!: string | null;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text' })
  type!: ContainerType;

  @Column({ type: 'text', nullable: true })
  icon!: string | null;

  @Column({ type: 'text', nullable: true })
  photoPath!: string | null;

  @Column({ type: 'text', unique: true })
  qrCode!: string;

  @Column({ type: 'integer', default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => RoomEntity, (room) => room.containers, { onDelete: 'CASCADE' })
  room!: RoomEntity;

  @ManyToOne(() => ContainerEntity, (container) => container.children, { nullable: true, onDelete: 'CASCADE' })
  parentContainer!: ContainerEntity | null;

  @OneToMany(() => ContainerEntity, (container) => container.parentContainer)
  children!: ContainerEntity[];

  @OneToMany(() => ItemEntity, (item) => item.container)
  items!: ItemEntity[];
}
