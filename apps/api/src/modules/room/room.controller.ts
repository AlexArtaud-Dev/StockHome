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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RoomService } from './room.service';
import { CreateRoomDto, UpdateRoomDto } from './room.dto';

@Controller('api/v1/rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.roomService.findAll(user.householdId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roomService.findOne(id, user.householdId);
  }

  @Post()
  create(@Body() dto: CreateRoomDto, @CurrentUser() user: JwtPayload) {
    return this.roomService.create(dto, user.householdId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomService.update(id, dto, user.householdId);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roomService.duplicate(id, user.householdId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roomService.remove(id, user.householdId);
  }
}
