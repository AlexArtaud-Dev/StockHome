import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { MovementLogService } from './movement-log.service';

@Controller('api/v1/items/:itemId/logs')
@UseGuards(JwtAuthGuard)
export class MovementLogController {
  constructor(private readonly movementLogService: MovementLogService) {}

  @Get()
  findByItem(@Param('itemId') itemId: string, @CurrentUser() user: JwtPayload) {
    return this.movementLogService.findByItem(itemId, user.householdId);
  }
}
