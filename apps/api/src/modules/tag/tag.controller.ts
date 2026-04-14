import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HouseholdGuard } from '../../common/guards/household.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { TagService } from './tag.service';

@Controller('api/v1/tags')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.tagService.findAll(user.householdId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tagService.remove(id, user.householdId!);
  }
}
