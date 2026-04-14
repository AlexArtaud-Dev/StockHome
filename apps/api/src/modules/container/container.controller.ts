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
import { ContainerService } from './container.service';
import { CreateContainerDto, UpdateContainerDto } from './container.dto';

@Controller('api/v1/containers')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('roomId') roomId?: string,
    @Query('parentContainerId') parentContainerId?: string,
  ) {
    return this.containerService.findAll(user.householdId!, roomId, parentContainerId);
  }

  @Get('by-qr/:qrCode')
  findByQrCode(
    @Param('qrCode') qrCode: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.containerService.findByQrCode(qrCode, user.householdId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.containerService.findOne(id, user.householdId!);
  }

  @Post()
  create(@Body() dto: CreateContainerDto, @CurrentUser() user: JwtPayload) {
    return this.containerService.create(dto, user.householdId!);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContainerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.containerService.update(id, dto, user.householdId!);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.containerService.duplicate(id, user.householdId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.containerService.remove(id, user.householdId!);
  }
}
