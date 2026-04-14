import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HouseholdGuard } from '../../common/guards/household.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { MovementLogService } from './movement-log.service';

@Controller('api/v1/items/:itemId/logs')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class MovementLogController {
  constructor(private readonly movementLogService: MovementLogService) {}

  @Get()
  findByItem(@Param('itemId') itemId: string, @CurrentUser() user: JwtPayload) {
    return this.movementLogService.findByItem(itemId, user.householdId!);
  }
}

@Controller('api/v1/history')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class HistoryController {
  constructor(private readonly movementLogService: MovementLogService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.movementLogService.findByHousehold(
      user.householdId!,
      parseInt(limit ?? '100', 10),
      parseInt(offset ?? '0', 10),
    );
  }

  @Get('export')
  async export(
    @CurrentUser() user: JwtPayload,
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ) {
    if (format === 'csv') {
      const csv = await this.movementLogService.exportCsv(user.householdId!);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=history.csv');
      res.send(csv);
    } else {
      const data = await this.movementLogService.exportJson(user.householdId!);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=history.json');
      res.json({ data });
    }
  }
}
