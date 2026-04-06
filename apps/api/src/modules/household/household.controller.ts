import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { HouseholdService, UpdateHouseholdDto } from './household.service';

@Controller('api/v1/household')
@UseGuards(JwtAuthGuard)
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @Get()
  findOne(@CurrentUser() user: JwtPayload) {
    return this.householdService.findOne(user.householdId);
  }

  @Patch()
  update(@Body() dto: UpdateHouseholdDto, @CurrentUser() user: JwtPayload) {
    return this.householdService.update(user.householdId, dto);
  }
}
