import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemEntity } from './item.entity';

@Entity('category')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  householdId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  parentCategoryId!: string | null;

  @Column({ type: 'text', nullable: true })
  icon!: string | null;

  @Column({ type: 'text', nullable: true })
  color!: string | null;

  @ManyToOne(() => CategoryEntity, (cat) => cat.children, { nullable: true })
  parentCategory!: CategoryEntity | null;

  @OneToMany(() => CategoryEntity, (cat) => cat.parentCategory)
  children!: CategoryEntity[];

  @ManyToMany(() => ItemEntity, (item) => item.categories)
  items!: ItemEntity[];
}
