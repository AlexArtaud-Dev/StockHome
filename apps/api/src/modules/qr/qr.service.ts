import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ContainerEntity } from '../../database/entities/container.entity';

const QR_SIZE = 150;
const LABEL_HEIGHT = 20;
const CELL_WIDTH = 170;
const CELL_HEIGHT = QR_SIZE + LABEL_HEIGHT + 10;
const COLS = 3;
const MARGIN = 20;

@Injectable()
export class QrService {
  constructor(
    @InjectRepository(ContainerEntity)
    private readonly containerRepo: Repository<ContainerEntity>,
  ) {}

  async generateQrDataUrl(qrCode: string): Promise<string> {
    return QRCode.toDataURL(qrCode, { width: 300, margin: 1 });
  }

  async exportPdf(containerIds: string[], householdId: string): Promise<Buffer> {
    const containers = await this.containerRepo
      .createQueryBuilder('c')
      .innerJoin('c.room', 'r')
      .where('c.id IN (:...ids)', { ids: containerIds })
      .andWhere('r.householdId = :householdId', { householdId })
      .getMany();

    if (containers.length === 0) throw new NotFoundException('No containers found');

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = MARGIN * 2 + COLS * CELL_WIDTH;
    const rows = Math.ceil(containers.length / COLS);
    const pageHeight = MARGIN * 2 + rows * CELL_HEIGHT;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      const x = MARGIN + col * CELL_WIDTH;
      const y = pageHeight - MARGIN - (row + 1) * CELL_HEIGHT;

      const qrDataUrl = await QRCode.toDataURL(container.qrCode, {
        width: QR_SIZE,
        margin: 1,
      });
      const qrImageData = qrDataUrl.split(',')[1]!;
      const qrImage = await pdfDoc.embedPng(Buffer.from(qrImageData, 'base64'));

      page.drawImage(qrImage, {
        x,
        y: y + LABEL_HEIGHT,
        width: QR_SIZE,
        height: QR_SIZE,
      });

      const label = container.name.length > 20
        ? container.name.substring(0, 18) + '…'
        : container.name;

      page.drawText(label, {
        x,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
