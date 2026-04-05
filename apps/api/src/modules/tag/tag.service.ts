import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from '../../database/entities/tag.entity';
import { Tag } from '@stockhome/shared';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
  ) {}

  async findAll(householdId: string): Promise<Tag[]> {
    const tags = await this.tagRepo.find({
      where: { householdId },
      order: { name: 'ASC' },
    });
    return tags.map((t) => ({ id: t.id, householdId: t.householdId, name: t.name }));
  }

  async remove(id: string, householdId: string): Promise<void> {
    const tag = await this.tagRepo.findOneBy({ id, householdId });
    if (!tag) throw new NotFoundException('Tag not found');
    await this.tagRepo.remove(tag);
  }
}
