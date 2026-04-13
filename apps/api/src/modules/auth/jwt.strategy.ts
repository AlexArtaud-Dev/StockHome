import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { HouseholdMemberEntity } from '../../database/entities/household-member.entity';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(HouseholdMemberEntity)
    private readonly memberRepo: Repository<HouseholdMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] ?? 'dev_secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; username: string; isAdmin: boolean }): Promise<JwtPayload> {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    const requestedHouseholdId = req.headers['x-household-id'] as string | undefined;
    let resolvedHouseholdId: string | null = null;

    if (requestedHouseholdId) {
      // Check if user is a member of the requested household
      const membership = await this.memberRepo.findOneBy({
        userId: payload.sub,
        householdId: requestedHouseholdId,
      });

      if (membership) {
        resolvedHouseholdId = requestedHouseholdId;
      } else {
        // Fallback: check if it's the user's legacy householdId
        const user = await this.userRepo.findOneBy({ id: payload.sub });
        if (user?.householdId === requestedHouseholdId) {
          resolvedHouseholdId = requestedHouseholdId;
        } else {
          // Not a member — treat as no household context rather than throwing 401
          resolvedHouseholdId = null;
        }
      }
    } else {
      // No header — use the first household from membership table or legacy householdId
      const firstMembership = await this.memberRepo.findOne({
        where: { userId: payload.sub },
        order: { joinedAt: 'ASC' },
      });
      if (firstMembership) {
        resolvedHouseholdId = firstMembership.householdId;
      } else {
        // Legacy: use the user's direct householdId
        const user = await this.userRepo.findOneBy({ id: payload.sub });
        resolvedHouseholdId = user?.householdId ?? null;
      }
    }

    return {
      sub: payload.sub,
      username: payload.username,
      isAdmin: payload.isAdmin ?? false,
      householdId: resolvedHouseholdId,
    };
  }
}
