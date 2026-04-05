import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovementLogEntity } from '../../database/entities/movement-log.entity';
import { MovementLog } from '@stockhome/shared';

@Injectable()
export class MovementLogService {
  constructor(
    @InjectRepository(MovementLogEntity)
    private readonly logRepo: Repository<MovementLogEntity>,
  ) {}

  async findByItem(itemId: string, householdId: string): Promise<MovementLog[]> {
    const logs = await this.logRepo
      .createQueryBuilder('l')
      .innerJoin('l.item', 'i')
      .where('l.itemId = :itemId', { itemId })
      .andWhere('i.householdId = :householdId', { householdId })
      .orderBy('l.createdAt', 'DESC')
      .limit(100)
      .getMany();

    return logs.map(this.toDto);
  }

  private toDto(log: MovementLogEntity): MovementLog {
    return {
      id: log.id,
      itemId: log.itemId,
      userId: log.userId,
      action: log.action,
      details: JSON.parse(log.details) as Record<string, unknown>,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
