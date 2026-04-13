import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { HouseholdEntity, HouseholdType } from '../../database/entities/household.entity';
import { HouseholdMemberEntity } from '../../database/entities/household-member.entity';
import { HouseholdInvitationEntity } from '../../database/entities/household-invitation.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { EmailService } from '../email/email.service';

const HOUSEHOLD_TYPES: HouseholdType[] = [
  'house', 'flat', 'apartment', 'studio', 'garage', 'office', 'storage', 'other',
];

export class CreateHouseholdDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  @IsIn(HOUSEHOLD_TYPES)
  type?: HouseholdType;
}

export class UpdateHouseholdDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(HOUSEHOLD_TYPES)
  type?: HouseholdType;
}

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

function toHouseholdDto(h: HouseholdEntity, isOwner: boolean) {
  return {
    id: h.id,
    name: h.name,
    type: h.type,
    ownerId: h.ownerId,
    isOwner,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  };
}

@Injectable()
export class HouseholdService {
  constructor(
    @InjectRepository(HouseholdEntity)
    private readonly householdRepo: Repository<HouseholdEntity>,
    @InjectRepository(HouseholdMemberEntity)
    private readonly memberRepo: Repository<HouseholdMemberEntity>,
    @InjectRepository(HouseholdInvitationEntity)
    private readonly invitationRepo: Repository<HouseholdInvitationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateHouseholdDto, userId: string) {
    const household = this.householdRepo.create({
      id: uuidv4(),
      name: dto.name,
      type: dto.type ?? 'other',
      ownerId: userId,
    });
    await this.householdRepo.save(household);

    // Add creator as member
    const member = this.memberRepo.create({
      id: uuidv4(),
      userId,
      householdId: household.id,
    });
    await this.memberRepo.save(member);

    return toHouseholdDto(household, true);
  }

  async findAllForUser(userId: string) {
    const memberships = await this.memberRepo.find({ where: { userId } });
    const householdIds = memberships.map((m) => m.householdId);

    if (householdIds.length === 0) return [];

    const households = await Promise.all(
      householdIds.map((id) => this.householdRepo.findOneBy({ id })),
    );

    return households
      .filter((h): h is HouseholdEntity => h !== null)
      .map((h) => toHouseholdDto(h, h.ownerId === userId));
  }

  async findOne(id: string, userId: string) {
    const h = await this.householdRepo.findOneBy({ id });
    if (!h) throw new NotFoundException('Household not found');

    const isMember = await this.isMemberOf(userId, id);
    if (!isMember) throw new ForbiddenException('Not a member of this household');

    return toHouseholdDto(h, h.ownerId === userId);
  }

  async update(id: string, dto: UpdateHouseholdDto, userId: string) {
    const h = await this.householdRepo.findOneBy({ id });
    if (!h) throw new NotFoundException('Household not found');
    if (h.ownerId !== userId) throw new ForbiddenException('Only the owner can update this household');

    if (dto.name !== undefined) h.name = dto.name;
    if (dto.type !== undefined) h.type = dto.type;
    await this.householdRepo.save(h);

    return toHouseholdDto(h, true);
  }

  async remove(id: string, userId: string) {
    const h = await this.householdRepo.findOneBy({ id });
    if (!h) throw new NotFoundException('Household not found');
    if (h.ownerId !== userId) throw new ForbiddenException('Only the owner can delete this household');

    await this.memberRepo.delete({ householdId: id });
    await this.invitationRepo.delete({ householdId: id });
    await this.householdRepo.remove(h);
  }

  async getMembers(householdId: string, userId: string) {
    const isMember = await this.isMemberOf(userId, householdId);
    if (!isMember) throw new ForbiddenException('Not a member of this household');

    const memberships = await this.memberRepo.find({ where: { householdId } });
    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await this.userRepo.findOneBy({ id: m.userId });
        if (!user) return null;
        return {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          email: user.email,
          joinedAt: m.joinedAt.toISOString(),
          isOwner: user.id === (await this.householdRepo.findOneBy({ id: householdId }))?.ownerId,
        };
      }),
    );
    return members.filter(Boolean);
  }

  async removeMember(householdId: string, targetUserId: string, requestingUserId: string) {
    const h = await this.householdRepo.findOneBy({ id: householdId });
    if (!h) throw new NotFoundException('Household not found');

    if (h.ownerId !== requestingUserId && targetUserId !== requestingUserId) {
      throw new ForbiddenException('Only the owner can remove members');
    }
    if (targetUserId === h.ownerId) {
      throw new BadRequestException('The owner cannot be removed. Transfer ownership first or delete the household.');
    }

    await this.memberRepo.delete({ householdId, userId: targetUserId });
  }

  async leave(householdId: string, userId: string) {
    const h = await this.householdRepo.findOneBy({ id: householdId });
    if (!h) throw new NotFoundException('Household not found');
    if (h.ownerId === userId) {
      throw new BadRequestException('The owner cannot leave. Delete the household or transfer ownership first.');
    }
    await this.memberRepo.delete({ householdId, userId });
  }

  async inviteMember(householdId: string, dto: InviteMemberDto, invitedByUserId: string) {
    const h = await this.householdRepo.findOneBy({ id: householdId });
    if (!h) throw new NotFoundException('Household not found');

    const isMember = await this.isMemberOf(invitedByUserId, householdId);
    if (!isMember) throw new ForbiddenException('Not a member of this household');

    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if user with this email is already a member
    const invitedUser = await this.userRepo.findOneBy({ email: normalizedEmail });
    if (invitedUser) {
      const alreadyMember = await this.memberRepo.findOneBy({
        userId: invitedUser.id,
        householdId,
      });
      if (alreadyMember) {
        throw new BadRequestException('This user is already a member of the household');
      }
    }

    // Check for existing pending invitation
    const existingInvite = await this.invitationRepo.findOneBy({
      householdId,
      invitedEmail: normalizedEmail,
      status: 'pending',
    });
    if (existingInvite) {
      throw new BadRequestException('An invitation has already been sent to this email');
    }

    const token = uuidv4();
    const invitation = this.invitationRepo.create({
      id: uuidv4(),
      householdId,
      invitedEmail: normalizedEmail,
      invitedByUserId,
      token,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await this.invitationRepo.save(invitation);

    const inviter = await this.userRepo.findOneBy({ id: invitedByUserId });
    const inviterName = inviter?.displayName ?? inviter?.username ?? 'Someone';
    await this.emailService.sendInvitationEmail(normalizedEmail, h.name, inviterName, token);

    return { message: 'Invitation sent' };
  }

  async getPendingInvitations(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user?.email) return [];

    const invitations = await this.invitationRepo.find({
      where: { invitedEmail: user.email.toLowerCase(), status: 'pending' },
    });

    const result = await Promise.all(
      invitations
        .filter((inv) => inv.expiresAt > new Date())
        .map(async (inv) => {
          const household = await this.householdRepo.findOneBy({ id: inv.householdId });
          const inviter = await this.userRepo.findOneBy({ id: inv.invitedByUserId });
          return {
            id: inv.id,
            householdId: inv.householdId,
            householdName: household?.name ?? 'Unknown',
            inviterName: inviter?.displayName ?? inviter?.username ?? 'Someone',
            createdAt: inv.createdAt.toISOString(),
          };
        }),
    );
    return result;
  }

  async acceptInvitation(invitationId: string, userId: string) {
    const inv = await this.invitationRepo.findOneBy({ id: invitationId, status: 'pending' });
    if (!inv) throw new NotFoundException('Invitation not found or already used');
    if (inv.expiresAt < new Date()) throw new BadRequestException('Invitation has expired');

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user || user.email?.toLowerCase() !== inv.invitedEmail.toLowerCase()) {
      throw new ForbiddenException('This invitation was not sent to your email address');
    }

    // Add to household
    const existing = await this.memberRepo.findOneBy({ userId, householdId: inv.householdId });
    if (!existing) {
      const member = this.memberRepo.create({
        id: uuidv4(),
        userId,
        householdId: inv.householdId,
      });
      await this.memberRepo.save(member);
    }

    inv.status = 'accepted';
    await this.invitationRepo.save(inv);

    return { message: 'Invitation accepted' };
  }

  async declineInvitation(invitationId: string, userId: string) {
    const inv = await this.invitationRepo.findOneBy({ id: invitationId, status: 'pending' });
    if (!inv) throw new NotFoundException('Invitation not found or already used');

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user || user.email?.toLowerCase() !== inv.invitedEmail.toLowerCase()) {
      throw new ForbiddenException('This invitation was not sent to your email address');
    }

    inv.status = 'declined';
    await this.invitationRepo.save(inv);

    return { message: 'Invitation declined' };
  }

  private async isMemberOf(userId: string, householdId: string): Promise<boolean> {
    const member = await this.memberRepo.findOneBy({ userId, householdId });
    if (member) return true;
    // Legacy fallback: check user.householdId
    const user = await this.userRepo.findOneBy({ id: userId });
    return user?.householdId === householdId;
  }
}
