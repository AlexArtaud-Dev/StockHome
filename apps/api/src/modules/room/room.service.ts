import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RoomEntity } from '../../database/entities/room.entity';
import { CreateRoomDto, UpdateRoomDto } from './room.dto';
import { Room } from '@stockhome/shared';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepo: Repository<RoomEntity>,
  ) {}

  async findAll(householdId: string): Promise<Room[]> {
    const rooms = await this.roomRepo.find({
      where: { householdId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return rooms.map(this.toDto);
  }

  async findOne(id: string, householdId: string): Promise<Room> {
    const room = await this.roomRepo.findOneBy({ id, householdId });
    if (!room) throw new NotFoundException('Room not found');
    return this.toDto(room);
  }

  async create(dto: CreateRoomDto, householdId: string): Promise<Room> {
    const room = this.roomRepo.create({
      id: uuidv4(),
      householdId,
      name: dto.name,
      icon: dto.icon ?? null,
      color: dto.color ?? null,
      photoPath: dto.photoPath ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });
    await this.roomRepo.save(room);
    return this.toDto(room);
  }

  async update(id: string, dto: UpdateRoomDto, householdId: string): Promise<Room> {
    const room = await this.roomRepo.findOneBy({ id, householdId });
    if (!room) throw new NotFoundException('Room not found');
    Object.assign(room, dto);
    await this.roomRepo.save(room);
    return this.toDto(room);
  }

  async duplicate(id: string, householdId: string): Promise<Room> {
    const room = await this.roomRepo.findOneBy({ id, householdId });
    if (!room) throw new NotFoundException('Room not found');
    const copy = this.roomRepo.create({
      id: uuidv4(),
      householdId,
      name: `${room.name} (copy)`,
      icon: room.icon,
      color: room.color,
      photoPath: room.photoPath,
      sortOrder: room.sortOrder,
    });
    await this.roomRepo.save(copy);
    return this.toDto(copy);
  }

  async remove(id: string, householdId: string): Promise<void> {
    const room = await this.roomRepo.findOneBy({ id, householdId });
    if (!room) throw new NotFoundException('Room not found');
    await this.roomRepo.remove(room);
  }

  private toDto(room: RoomEntity): Room {
    return {
      id: room.id,
      householdId: room.householdId,
      name: room.name,
      icon: room.icon,
      color: room.color,
      photoPath: room.photoPath ?? null,
      sortOrder: room.sortOrder,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }
}
