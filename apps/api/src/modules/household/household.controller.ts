import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import {
  CreateHouseholdDto,
  HouseholdService,
  InviteMemberDto,
  UpdateHouseholdDto,
} from './household.service';

@Controller('api/v1/households')
@UseGuards(JwtAuthGuard)
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @Post()
  create(@Body() dto: CreateHouseholdDto, @CurrentUser() user: JwtPayload) {
    return this.householdService.create(dto, user.sub);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.householdService.findAllForUser(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.householdService.findOne(id, user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHouseholdDto, @CurrentUser() user: JwtPayload) {
    return this.householdService.update(id, dto, user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.householdService.remove(id, user.sub);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.householdService.getMembers(id, user.sub);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdService.removeMember(id, targetUserId, user.sub);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.householdService.leave(id, user.sub);
  }

  @Post(':id/invite')
  invite(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdService.inviteMember(id, dto, user.sub);
  }

  @Get(':id/invitations/pending')
  getPendingForHousehold(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    // Returns pending invitations (for current user's email)
    return this.householdService.findOne(id, user.sub);
  }
}

// Separate route for user's own pending invitations
@Controller('api/v1/invitations')
@UseGuards(JwtAuthGuard)
export class InvitationController {
  constructor(private readonly householdService: HouseholdService) {}

  @Get('pending')
  async getPending(@CurrentUser() user: JwtPayload) {
    // Need the user's email — query from service
    return this.householdService.getPendingInvitations(user.sub);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.householdService.acceptInvitation(id, user.sub);
  }

  @Post(':id/decline')
  decline(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.householdService.declineInvitation(id, user.sub);
  }
}
