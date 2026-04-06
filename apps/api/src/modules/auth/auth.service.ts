import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../database/entities/user.entity';
import { HouseholdEntity } from '../../database/entities/household.entity';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthResponse, AuthTokens } from '@stockhome/shared';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(HouseholdEntity)
    private readonly householdRepo: Repository<HouseholdEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.userRepo.findOneBy({ username: dto.username });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const household = this.householdRepo.create({
      id: uuidv4(),
      name: dto.householdName,
    });
    await this.householdRepo.save(household);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      id: uuidv4(),
      householdId: household.id,
      username: dto.username,
      passwordHash,
      displayName: dto.displayName ?? null,
    });
    await this.userRepo.save(user);

    const tokens = this.generateTokens(user, household.id);
    return {
      user: {
        id: user.id,
        householdId: user.householdId,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepo.findOneBy({ username: dto.username });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user, user.householdId);
    return {
      user: {
        id: user.id,
        householdId: user.householdId,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        householdId: string;
        username: string;
        type: string;
      }>(refreshToken, {
        secret: process.env['JWT_REFRESH_SECRET'] ?? 'dev_refresh_secret',
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userRepo.findOneBy({ id: payload.sub });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user, user.householdId);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: UserEntity, householdId: string): AuthTokens {
    const payload = { sub: user.id, username: user.username, householdId };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env['JWT_SECRET'] ?? 'dev_secret',
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: process.env['JWT_REFRESH_SECRET'] ?? 'dev_refresh_secret',
        expiresIn: '7d',
      },
    );
    return { accessToken, refreshToken };
  }
}
