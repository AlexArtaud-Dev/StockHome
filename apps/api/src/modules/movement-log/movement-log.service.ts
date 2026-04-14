import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovementLogEntity } from '../../database/entities/movement-log.entity';
import { MovementLogEnriched } from '@stockhome/shared';

@Injectable()
export class MovementLogService {
  constructor(
    @InjectRepository(MovementLogEntity)
    private readonly logRepo: Repository<MovementLogEntity>,
  ) {}

  async findByHousehold(
    householdId: string,
    limit = 100,
    offset = 0,
  ): Promise<MovementLogEnriched[]> {
    const logs = await this.logRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.item', 'i')
      .leftJoinAndSelect('l.user', 'u')
      .where('i.householdId = :householdId', { householdId })
      .orderBy('l.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    return logs.map(this.toEnrichedDto);
  }

  async findByItem(itemId: string, householdId: string): Promise<MovementLogEnriched[]> {
    const logs = await this.logRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.item', 'i')
      .leftJoinAndSelect('l.user', 'u')
      .where('l.itemId = :itemId', { itemId })
      .andWhere('i.householdId = :householdId', { householdId })
      .orderBy('l.createdAt', 'DESC')
      .limit(100)
      .getMany();

    return logs.map(this.toEnrichedDto);
  }

  async exportCsv(householdId: string): Promise<string> {
    const logs = await this.findByHousehold(householdId, 10000, 0);
    const header = 'id,itemId,itemName,userId,userName,action,details,createdAt';
    const escapeCsv = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    const rows = logs.map((log) =>
      [
        escapeCsv(log.id),
        escapeCsv(log.itemId),
        escapeCsv(log.itemName),
        escapeCsv(log.userId),
        escapeCsv(log.userName),
        escapeCsv(log.action),
        escapeCsv(JSON.stringify(log.details)),
        escapeCsv(log.createdAt),
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }

  async exportJson(householdId: string): Promise<MovementLogEnriched[]> {
    return this.findByHousehold(householdId, 10000, 0);
  }

  private toEnrichedDto(log: MovementLogEntity): MovementLogEnriched {
    const item = log.item;
    const user = log.user;
    return {
      id: log.id,
      itemId: log.itemId,
      itemName: item?.name ?? 'Unknown',
      userId: log.userId,
      userName: user
        ? (user.displayName ?? (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username))
        : 'Unknown',
      action: log.action,
      details: JSON.parse(log.details) as Record<string, unknown>,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
