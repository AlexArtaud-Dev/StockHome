import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdEntity } from '../../database/entities/household.entity';
import { IsNotEmpty, IsString } from 'class-validator';
import { Household } from '@stockhome/shared';

export class UpdateHouseholdDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

@Injectable()
export class HouseholdService {
  constructor(
    @InjectRepository(HouseholdEntity)
    private readonly householdRepo: Repository<HouseholdEntity>,
  ) {}

  async findOne(id: string): Promise<Household> {
    const h = await this.householdRepo.findOneBy({ id });
    if (!h) throw new NotFoundException('Household not found');
    return { id: h.id, name: h.name, createdAt: h.createdAt.toISOString(), updatedAt: h.updatedAt.toISOString() };
  }

  async update(id: string, dto: UpdateHouseholdDto): Promise<Household> {
    const h = await this.householdRepo.findOneBy({ id });
    if (!h) throw new NotFoundException('Household not found');
    h.name = dto.name;
    await this.householdRepo.save(h);
    return { id: h.id, name: h.name, createdAt: h.createdAt.toISOString(), updatedAt: h.updatedAt.toISOString() };
  }
}
