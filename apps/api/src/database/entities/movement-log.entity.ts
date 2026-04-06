import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemEntity } from './item.entity';
import { UserEntity } from './user.entity';
import { MovementAction } from '@stockhome/shared';

@Entity('movement_log')
export class MovementLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  itemId!: string;

  @Column({ type: 'text' })
  userId!: string;

  @Column({ type: 'text' })
  action!: MovementAction;

  @Column({ type: 'text', default: '{}' })
  details!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => ItemEntity)
  @JoinColumn({ name: 'itemId' })
  item!: ItemEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
