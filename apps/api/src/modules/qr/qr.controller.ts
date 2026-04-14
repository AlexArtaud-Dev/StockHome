import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HouseholdGuard } from '../../common/guards/household.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { QrService } from './qr.service';
import { IsArray, IsUUID } from 'class-validator';

class ExportPdfDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  containerIds!: string[];
}

@Controller('api/v1/qr')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get('containers/:qrCode')
  async getQrDataUrl(@Param('qrCode') qrCode: string) {
    const url = await this.qrService.generateQrDataUrl(qrCode);
    return { url };
  }

  @Post('export-pdf')
  async exportPdf(
    @Body() dto: ExportPdfDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const pdf = await this.qrService.exportPdf(dto.containerIds, user.householdId!);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="qr-labels.pdf"',
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
