import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CategoryEntity } from '../../database/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { Category } from '@stockhome/shared';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
  ) {}

  async findAll(householdId: string): Promise<Category[]> {
    const cats = await this.categoryRepo.find({
      where: { householdId },
      order: { name: 'ASC' },
    });
    return cats.map(this.toDto);
  }

  async create(dto: CreateCategoryDto, householdId: string): Promise<Category> {
    const cat = this.categoryRepo.create({
      id: uuidv4(),
      householdId,
      name: dto.name,
      parentCategoryId: dto.parentCategoryId ?? null,
      icon: dto.icon ?? null,
      color: dto.color ?? null,
    });
    await this.categoryRepo.save(cat);
    return this.toDto(cat);
  }

  async update(id: string, dto: UpdateCategoryDto, householdId: string): Promise<Category> {
    const cat = await this.categoryRepo.findOneBy({ id, householdId });
    if (!cat) throw new NotFoundException('Category not found');
    Object.assign(cat, dto);
    await this.categoryRepo.save(cat);
    return this.toDto(cat);
  }

  async remove(id: string, householdId: string): Promise<void> {
    const cat = await this.categoryRepo.findOneBy({ id, householdId });
    if (!cat) throw new NotFoundException('Category not found');
    await this.categoryRepo.remove(cat);
  }

  private toDto(cat: CategoryEntity): Category {
    return {
      id: cat.id,
      householdId: cat.householdId,
      name: cat.name,
      parentCategoryId: cat.parentCategoryId,
      icon: cat.icon,
      color: cat.color,
    };
  }
}
