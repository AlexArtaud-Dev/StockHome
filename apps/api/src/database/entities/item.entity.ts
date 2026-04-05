import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContainerEntity } from './container.entity';
import { RoomEntity } from './room.entity';
import { CategoryEntity } from './category.entity';
import { TagEntity } from './tag.entity';
import { StockRuleEntity } from './stock-rule.entity';

@Entity('item')
export class ItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true })
  containerId!: string | null;

  @Column({ type: 'text' })
  roomId!: string;

  @Column({ type: 'text' })
  householdId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'integer', default: 1 })
  quantity!: number;

  @Column({ type: 'text', nullable: true })
  icon!: string | null;

  @Column({ type: 'text', nullable: true })
  photoPath!: string | null;

  @Column({ type: 'text', nullable: true, unique: true })
  qrCode!: string | null;

  @Column({ type: 'boolean', default: false })
  isConsumable!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => ContainerEntity, (container) => container.items, { nullable: true })
  container!: ContainerEntity | null;

  @ManyToOne(() => RoomEntity, (room) => room.items)
  room!: RoomEntity;

  @ManyToMany(() => CategoryEntity, (category) => category.items, { eager: false })
  @JoinTable({
    name: 'item_category',
    joinColumn: { name: 'item_id' },
    inverseJoinColumn: { name: 'category_id' },
  })
  categories!: CategoryEntity[];

  @ManyToMany(() => TagEntity, (tag) => tag.items, { eager: false })
  @JoinTable({
    name: 'item_tag',
    joinColumn: { name: 'item_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags!: TagEntity[];

  @OneToOne(() => StockRuleEntity, (rule) => rule.item, { nullable: true })
  @JoinColumn({ name: 'id', referencedColumnName: 'itemId' })
  stockRule!: StockRuleEntity | null;
}
