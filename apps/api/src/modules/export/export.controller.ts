import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HouseholdGuard } from '../../common/guards/household.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ExportService } from './export.service';

@Controller('api/v1/export')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('household/pdf')
  async exportHousehold(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    const buffer = await this.exportService.exportHouseholdPdf(user.householdId!);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="household.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('rooms/:id/pdf')
  async exportRoom(
    @Param('id') roomId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportRoomPdf(roomId, user.householdId!);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="room-${roomId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
