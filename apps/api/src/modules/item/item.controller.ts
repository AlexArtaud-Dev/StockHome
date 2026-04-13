import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HouseholdGuard } from '../../common/guards/household.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ItemService } from './item.service';
import { AdjustQuantityDto, BulkCreateItemDto, CreateItemDto, UpdateItemDto } from './item.dto';

@Controller('api/v1/items')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('containerId') containerId?: string,
    @Query('roomId') roomId?: string,
  ) {
    return this.itemService.findAll(user.householdId, containerId, roomId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.itemService.findOne(id, user.householdId!);
  }

  @Post()
  create(@Body() dto: CreateItemDto, @CurrentUser() user: JwtPayload) {
    return this.itemService.create(dto, user.householdId, user.sub);
  }

  @Post('bulk')
  bulkCreate(@Body() dto: BulkCreateItemDto, @CurrentUser() user: JwtPayload) {
    return this.itemService.bulkCreate(dto, user.householdId, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemService.update(id, dto, user.householdId, user.sub);
  }

  @Patch(':id/quantity')
  adjustQuantity(
    @Param('id') id: string,
    @Body() dto: AdjustQuantityDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemService.adjustQuantity(id, dto, user.householdId, user.sub);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.itemService.duplicate(id, user.householdId, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.itemService.remove(id, user.householdId, user.sub);
  }
}
