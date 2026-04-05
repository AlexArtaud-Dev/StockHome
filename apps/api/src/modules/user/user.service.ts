import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { User } from '@stockhome/shared';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findMembers(householdId: string): Promise<User[]> {
    const users = await this.userRepo.find({ where: { householdId } });
    return users.map(this.toDto);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return this.toDto(user);
  }

  private toDto(user: UserEntity): User {
    return {
      id: user.id,
      householdId: user.householdId,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
