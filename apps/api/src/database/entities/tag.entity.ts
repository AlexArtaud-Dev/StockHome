import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemEntity } from './item.entity';

@Entity('tag')
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  householdId!: string;

  @Column({ type: 'text' })
  name!: string;

  @ManyToMany(() => ItemEntity, (item) => item.tags)
  items!: ItemEntity[];
}
