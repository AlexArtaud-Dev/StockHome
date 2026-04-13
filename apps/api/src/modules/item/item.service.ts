import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ItemEntity } from '../../database/entities/item.entity';
import { CategoryEntity } from '../../database/entities/category.entity';
import { TagEntity } from '../../database/entities/tag.entity';
import { MovementLogEntity } from '../../database/entities/movement-log.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { ContainerEntity } from '../../database/entities/container.entity';
import { AdjustQuantityDto, BulkCreateItemDto, CreateItemDto, UpdateItemDto } from './item.dto';
import { Item } from '@stockhome/shared';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(ItemEntity)
    private readonly itemRepo: Repository<ItemEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
    @InjectRepository(MovementLogEntity)
    private readonly movementLogRepo: Repository<MovementLogEntity>,
    @InjectRepository(RoomEntity)
    private readonly roomRepo: Repository<RoomEntity>,
  ) {}

  async findAll(householdId: string, containerId?: string, roomId?: string): Promise<Item[]> {
    const qb = this.itemRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.categories', 'cat')
      .leftJoinAndSelect('i.tags', 'tag')
      .leftJoinAndSelect('i.stockRule', 'stockRule')
      .where('i.householdId = :householdId', { householdId });

    if (containerId) {
      qb.andWhere('i.containerId = :containerId', { containerId });
    }

    if (roomId) {
      qb.andWhere('i.roomId = :roomId', { roomId });
    }

    const items = await qb.orderBy('i.name', 'ASC').getMany();
    return items.map(this.toDto);
  }

  async findOne(id: string, householdId: string): Promise<Item> {
    const item = await this.itemRepo.findOne({
      where: { id, householdId },
      relations: ['categories', 'tags', 'stockRule'],
    });
    if (!item) throw new NotFoundException('Item not found');
    return this.toDto(item);
  }

  async create(dto: CreateItemDto, householdId: string, userId: string): Promise<Item> {
    const room = await this.roomRepo.findOneBy({ id: dto.roomId, householdId });
    if (!room) throw new NotFoundException('Room not found');

    const categories = dto.categoryIds?.length
      ? await this.categoryRepo.findBy({ id: In(dto.categoryIds) })
      : [];

    const tags = await this.resolveOrCreateTags(dto.tagNames ?? [], householdId);

    const item = this.itemRepo.create({
      id: uuidv4(),
      householdId,
      room: { id: dto.roomId },
      container: dto.containerId ? { id: dto.containerId } : null,
      name: dto.name,
      description: dto.description ?? null,
      quantity: dto.quantity ?? 1,
      icon: dto.icon ?? null,
      isConsumable: dto.isConsumable ?? false,
      categories,
      tags,
    });

    await this.itemRepo.save(item);
    await this.logMovement(item.id, userId, 'created', {});
    return this.toDto(item);
  }

  async bulkCreate(dto: BulkCreateItemDto, householdId: string, userId: string): Promise<Item[]> {
    return Promise.all(dto.items.map((item) => this.create(item, householdId, userId)));
  }

  async update(id: string, dto: UpdateItemDto, householdId: string, userId: string): Promise<Item> {
    const item = await this.itemRepo.findOne({
      where: { id, householdId },
      relations: ['categories', 'tags'],
    });
    if (!item) throw new NotFoundException('Item not found');

    const prevContainerId = item.containerId;

    if (dto.containerId !== undefined) {
      item.container = dto.containerId ? { id: dto.containerId } as ContainerEntity : null;
      item.containerId = dto.containerId ?? null;
    }
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.description !== undefined) item.description = dto.description ?? null;
    if (dto.quantity !== undefined) item.quantity = dto.quantity;
    if (dto.icon !== undefined) item.icon = dto.icon ?? null;
    if (dto.isConsumable !== undefined) item.isConsumable = dto.isConsumable;

    if (dto.categoryIds) {
      item.categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
    }
    if (dto.tagNames) {
      item.tags = await this.resolveOrCreateTags(dto.tagNames, householdId);
    }

    await this.itemRepo.save(item);

    const action =
      dto.containerId !== undefined && dto.containerId !== prevContainerId
        ? 'moved'
        : 'updated';

    await this.logMovement(item.id, userId, action, {
      fromContainer: prevContainerId,
      toContainer: item.containerId,
    });

    return this.toDto(item);
  }

  async adjustQuantity(
    id: string,
    dto: AdjustQuantityDto,
    householdId: string,
    userId: string,
  ): Promise<Item> {
    const item = await this.itemRepo.findOne({
      where: { id, householdId },
      relations: ['categories', 'tags', 'stockRule'],
    });
    if (!item) throw new NotFoundException('Item not found');

    const prev = item.quantity;
    item.quantity = Math.max(0, item.quantity + dto.delta);
    await this.itemRepo.save(item);
    await this.logMovement(item.id, userId, 'quantity_changed', {
      quantityDelta: dto.delta,
      prevQuantity: prev,
      newQuantity: item.quantity,
    });
    return this.toDto(item);
  }

  async duplicate(id: string, householdId: string, userId: string): Promise<Item> {
    const item = await this.itemRepo.findOne({
      where: { id, householdId },
      relations: ['tags', 'stockRule'],
    });
    if (!item) throw new NotFoundException('Item not found');

    const tags = item.tags ?? [];

    const copy = this.itemRepo.create({
      id: uuidv4(),
      householdId,
      room: { id: item.roomId },
      container: item.containerId ? { id: item.containerId } : null,
      name: `${item.name} (copy)`,
      description: item.description,
      quantity: item.quantity,
      icon: item.icon,
      isConsumable: item.isConsumable,
      tags,
    });
    await this.itemRepo.save(copy);
    await this.logMovement(copy.id, userId, 'created', { duplicatedFrom: id });
    return this.toDto(copy);
  }

  async remove(id: string, householdId: string, userId: string): Promise<void> {
    const item = await this.itemRepo.findOneBy({ id, householdId });
    if (!item) throw new NotFoundException('Item not found');
    await this.logMovement(item.id, userId, 'deleted', {});
    await this.itemRepo.remove(item);
  }

  private async resolveOrCreateTags(names: string[], householdId: string): Promise<TagEntity[]> {
    return Promise.all(
      names.map(async (name) => {
        let tag = await this.tagRepo.findOneBy({ name, householdId });
        if (!tag) {
          tag = this.tagRepo.create({ id: uuidv4(), householdId, name });
          await this.tagRepo.save(tag);
        }
        return tag;
      }),
    );
  }

  private async logMovement(
    itemId: string,
    userId: string,
    action: MovementLogEntity['action'],
    details: Record<string, unknown>,
  ): Promise<void> {
    const log = this.movementLogRepo.create({
      id: uuidv4(),
      itemId,
      userId,
      action,
      details: JSON.stringify(details),
    });
    await this.movementLogRepo.save(log);
  }

  private toDto(item: ItemEntity): Item {
    return {
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
      categories: item.categories?.map((c) => ({
        id: c.id,
        householdId: c.householdId,
        name: c.name,
        parentCategoryId: c.parentCategoryId,
        icon: c.icon,
        color: c.color,
      })),
      tags: item.tags?.map((t) => ({
        id: t.id,
        householdId: t.householdId,
        name: t.name,
      })),
      stockRule: item.stockRule
        ? {
            id: item.stockRule.id,
            itemId: item.stockRule.itemId,
            minQuantity: item.stockRule.minQuantity,
            renewalIntervalDays: item.stockRule.renewalIntervalDays,
            lastRenewedAt: item.stockRule.lastRenewedAt?.toISOString() ?? null,
            createdAt: item.stockRule.createdAt.toISOString(),
            updatedAt: item.stockRule.updatedAt.toISOString(),
          }
        : null,
    };
  }
}
