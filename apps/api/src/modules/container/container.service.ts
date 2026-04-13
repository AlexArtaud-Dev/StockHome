import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ContainerEntity } from '../../database/entities/container.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { CreateContainerDto, UpdateContainerDto } from './container.dto';
import { Container } from '@stockhome/shared';

@Injectable()
export class ContainerService {
  constructor(
    @InjectRepository(ContainerEntity)
    private readonly containerRepo: Repository<ContainerEntity>,
    @InjectRepository(RoomEntity)
    private readonly roomRepo: Repository<RoomEntity>,
  ) {}

  async findAll(householdId: string, roomId?: string, parentContainerId?: string): Promise<Container[]> {
    const queryBuilder = this.containerRepo
      .createQueryBuilder('c')
      .innerJoin('c.room', 'r')
      .where('r.householdId = :householdId', { householdId });

    if (roomId) {
      queryBuilder.andWhere('c.roomId = :roomId', { roomId });
    }

    if (parentContainerId === 'none') {
      queryBuilder.andWhere('c.parentContainerId IS NULL');
    } else if (parentContainerId) {
      queryBuilder.andWhere('c.parentContainerId = :parentContainerId', { parentContainerId });
    }

    const containers = await queryBuilder
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('c.createdAt', 'ASC')
      .getMany();

    return containers.map(this.toDto);
  }

  async findOne(id: string, householdId: string): Promise<Container> {
    const container = await this.containerRepo
      .createQueryBuilder('c')
      .innerJoin('c.room', 'r')
      .where('c.id = :id', { id })
      .andWhere('r.householdId = :householdId', { householdId })
      .getOne();

    if (!container) throw new NotFoundException('Container not found');
    return this.toDto(container);
  }

  async findByQrCode(qrCode: string, householdId: string): Promise<Container> {
    const container = await this.containerRepo
      .createQueryBuilder('c')
      .innerJoin('c.room', 'r')
      .where('c.qrCode = :qrCode', { qrCode })
      .andWhere('r.householdId = :householdId', { householdId })
      .getOne();

    if (!container) throw new NotFoundException('Container not found');
    return this.toDto(container);
  }

  private async getContainerDepth(containerId: string): Promise<number> {
    let depth = 0;
    let currentId: string | null = containerId;
    while (currentId) {
      const c = await this.containerRepo.findOneBy({ id: currentId });
      if (!c) break;
      currentId = c.parentContainerId;
      depth++;
    }
    return depth;
  }

  async create(dto: CreateContainerDto, householdId: string): Promise<Container> {
    const maxDepth = parseInt(process.env['MAX_CONTAINER_DEPTH'] ?? '3', 10);

    const room = await this.roomRepo.findOneBy({
      id: dto.roomId,
      householdId,
    });
    if (!room) throw new NotFoundException('Room not found');

    if (dto.parentContainerId) {
      const parent = await this.containerRepo.findOneBy({
        id: dto.parentContainerId,
      });
      if (!parent) throw new NotFoundException('Parent container not found');
      if (parent.roomId !== dto.roomId) {
        throw new BadRequestException('Parent container must be in the same room');
      }
      const parentDepth = await this.getContainerDepth(dto.parentContainerId);
      if (parentDepth >= maxDepth) {
        throw new BadRequestException(
          `Maximum container nesting depth of ${maxDepth} reached`,
        );
      }
    }

    const qrCode = uuidv4();
    const container = this.containerRepo.create({
      id: uuidv4(),
      roomId: dto.roomId,
      parentContainerId: dto.parentContainerId ?? null,
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type,
      icon: dto.icon ?? null,
      qrCode,
      sortOrder: dto.sortOrder ?? 0,
    });

    await this.containerRepo.save(container);
    return this.toDto(container);
  }

  async update(
    id: string,
    dto: UpdateContainerDto,
    householdId: string,
  ): Promise<Container> {
    const container = await this.containerRepo
      .createQueryBuilder('c')
      .innerJoin('c.room', 'r')
      .where('c.id = :id', { id })
      .andWhere('r.householdId = :householdId', { householdId })
      .getOne();

    if (!container) throw new NotFoundException('Container not found');
    Object.assign(container, dto);
    await this.containerRepo.save(container);
    return this.toDto(container);
  }

  async remove(id: string, householdId: string): Promise<void> {
    const container = await this.containerRepo
      .createQueryBuilder('c')
      .innerJoin('c.room', 'r')
      .where('c.id = :id', { id })
      .andWhere('r.householdId = :householdId', { householdId })
      .getOne();

    if (!container) throw new NotFoundException('Container not found');
    await this.containerRepo.remove(container);
  }

  private toDto(container: ContainerEntity): Container {
    return {
      id: container.id,
      roomId: container.roomId,
      parentContainerId: container.parentContainerId,
      name: container.name,
      description: container.description,
      type: container.type,
      icon: container.icon,
      photoPath: container.photoPath,
      qrCode: container.qrCode,
      sortOrder: container.sortOrder,
      createdAt: container.createdAt.toISOString(),
      updatedAt: container.updatedAt.toISOString(),
    };
  }
}
