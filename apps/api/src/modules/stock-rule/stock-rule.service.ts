import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { StockRuleEntity } from '../../database/entities/stock-rule.entity';
import { ItemEntity } from '../../database/entities/item.entity';
import { UpsertStockRuleDto } from './stock-rule.dto';
import { ShoppingListItem, StockRule } from '@stockhome/shared';

@Injectable()
export class StockRuleService {
  constructor(
    @InjectRepository(StockRuleEntity)
    private readonly ruleRepo: Repository<StockRuleEntity>,
    @InjectRepository(ItemEntity)
    private readonly itemRepo: Repository<ItemEntity>,
  ) {}

  async upsert(itemId: string, dto: UpsertStockRuleDto, householdId: string): Promise<StockRule> {
    const item = await this.itemRepo.findOneBy({ id: itemId, householdId });
    if (!item) throw new NotFoundException('Item not found');

    let rule = await this.ruleRepo.findOneBy({ itemId });
    if (rule) {
      if (dto.minQuantity !== undefined) rule.minQuantity = dto.minQuantity;
      if (dto.renewalIntervalDays !== undefined) rule.renewalIntervalDays = dto.renewalIntervalDays;
    } else {
      rule = this.ruleRepo.create({
        id: uuidv4(),
        itemId,
        minQuantity: dto.minQuantity ?? null,
        renewalIntervalDays: dto.renewalIntervalDays ?? null,
        lastRenewedAt: null,
      });
    }

    await this.ruleRepo.save(rule);
    return this.toDto(rule);
  }

  async remove(itemId: string, householdId: string): Promise<void> {
    const item = await this.itemRepo.findOneBy({ id: itemId, householdId });
    if (!item) throw new NotFoundException('Item not found');

    const rule = await this.ruleRepo.findOneBy({ itemId });
    if (rule) await this.ruleRepo.remove(rule);
  }

  async getShoppingList(householdId: string): Promise<ShoppingListItem[]> {
    const now = new Date();
    const items = await this.itemRepo
      .createQueryBuilder('i')
      .innerJoinAndSelect('i.stockRule', 'rule')
      .where('i.householdId = :householdId', { householdId })
      .andWhere('i.isConsumable = true')
      .getMany();

    const result: ShoppingListItem[] = [];

    for (const item of items) {
      const rule = item.stockRule;
      if (!rule) continue;

      if (rule.minQuantity !== null && item.quantity < rule.minQuantity) {
        result.push({
          item: {
            id: item.id,
            containerId: item.containerId,
            roomId: item.roomId,
            householdId: item.householdId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            icon: item.icon,
            photoPath: item.photoPath,
            qrCode: item.qrCode,
            isConsumable: item.isConsumable,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          },
          reason: 'below_minimum',
          currentQuantity: item.quantity,
          minQuantity: rule.minQuantity,
        });
        continue;
      }

      if (rule.renewalIntervalDays !== null && rule.lastRenewedAt !== null) {
        const renewalDue = new Date(rule.lastRenewedAt);
        renewalDue.setDate(renewalDue.getDate() + rule.renewalIntervalDays);
        if (renewalDue <= now) {
          result.push({
            item: {
              id: item.id,
              containerId: item.containerId,
              roomId: item.roomId,
              householdId: item.householdId,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              icon: item.icon,
              photoPath: item.photoPath,
              qrCode: item.qrCode,
              isConsumable: item.isConsumable,
              createdAt: item.createdAt.toISOString(),
              updatedAt: item.updatedAt.toISOString(),
            },
            reason: 'renewal_due',
            currentQuantity: item.quantity,
            minQuantity: rule.minQuantity,
          });
        }
      }
    }

    return result;
  }

  async markRenewed(itemId: string, householdId: string): Promise<StockRule> {
    const item = await this.itemRepo.findOneBy({ id: itemId, householdId });
    if (!item) throw new NotFoundException('Item not found');

    const rule = await this.ruleRepo.findOneBy({ itemId });
    if (!rule) throw new NotFoundException('Stock rule not found');

    rule.lastRenewedAt = new Date();
    await this.ruleRepo.save(rule);
    return this.toDto(rule);
  }

  private toDto(rule: StockRuleEntity): StockRule {
    return {
      id: rule.id,
      itemId: rule.itemId,
      minQuantity: rule.minQuantity,
      renewalIntervalDays: rule.renewalIntervalDays,
      lastRenewedAt: rule.lastRenewedAt?.toISOString() ?? null,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }
}
