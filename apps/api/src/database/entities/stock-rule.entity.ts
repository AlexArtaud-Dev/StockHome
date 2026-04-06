import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ItemEntity } from './item.entity';

@Entity('stock_rule')
export class StockRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  itemId!: string;

  @Column({ type: 'integer', nullable: true })
  minQuantity!: number | null;

  @Column({ type: 'integer', nullable: true })
  renewalIntervalDays!: number | null;

  @Column({ type: 'datetime', nullable: true })
  lastRenewedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => ItemEntity, (item) => item.stockRule)
  @JoinColumn({ name: 'itemId' })
  item!: ItemEntity;
}
