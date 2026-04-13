import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { RoomEntity } from '../../database/entities/room.entity';
import { ContainerEntity } from '../../database/entities/container.entity';
import { ItemEntity } from '../../database/entities/item.entity';
import { HouseholdEntity } from '../../database/entities/household.entity';

interface ContainerNode {
  container: ContainerEntity;
  items: ItemEntity[];
  children: ContainerNode[];
}

interface RoomNode {
  room: RoomEntity;
  rootContainers: ContainerNode[];
  looseItems: ItemEntity[];
}

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(HouseholdEntity)
    private readonly householdRepo: Repository<HouseholdEntity>,
    @InjectRepository(RoomEntity)
    private readonly roomRepo: Repository<RoomEntity>,
    @InjectRepository(ContainerEntity)
    private readonly containerRepo: Repository<ContainerEntity>,
    @InjectRepository(ItemEntity)
    private readonly itemRepo: Repository<ItemEntity>,
  ) {}

  async exportHouseholdPdf(householdId: string): Promise<Buffer> {
    const household = await this.householdRepo.findOneBy({ id: householdId });
    if (!household) throw new NotFoundException('Household not found');

    const rooms = await this.roomRepo.find({
      where: { householdId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const roomNodes: RoomNode[] = await Promise.all(
      rooms.map((room) => this.buildRoomNode(room, householdId)),
    );

    return this.renderPdf(household.name, roomNodes);
  }

  async exportRoomPdf(roomId: string, householdId: string): Promise<Buffer> {
    const room = await this.roomRepo.findOneBy({ id: roomId, householdId });
    if (!room) throw new NotFoundException('Room not found');

    const roomNode = await this.buildRoomNode(room, householdId);
    return this.renderPdf(room.name, [roomNode]);
  }

  private async buildRoomNode(room: RoomEntity, householdId: string): Promise<RoomNode> {
    const allContainers = await this.containerRepo
      .createQueryBuilder('c')
      .innerJoin('c.room', 'r')
      .where('c.roomId = :roomId', { roomId: room.id })
      .andWhere('r.householdId = :householdId', { householdId })
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('c.createdAt', 'ASC')
      .getMany();

    const allItems = await this.itemRepo.find({ where: { roomId: room.id, householdId } });

    const containerMap = new Map<string, ContainerNode>();
    for (const c of allContainers) {
      containerMap.set(c.id, {
        container: c,
        items: allItems.filter((i) => i.containerId === c.id),
        children: [],
      });
    }

    const rootContainers: ContainerNode[] = [];
    for (const c of allContainers) {
      const node = containerMap.get(c.id)!;
      if (c.parentContainerId && containerMap.has(c.parentContainerId)) {
        containerMap.get(c.parentContainerId)!.children.push(node);
      } else {
        rootContainers.push(node);
      }
    }

    const looseItems = allItems.filter((i) => !i.containerId);

    return { room, rootContainers, looseItems };
  }

  private async renderPdf(title: string, roomNodes: RoomNode[]): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

    const PAGE_W = 595;
    const PAGE_H = 842;
    const MARGIN = 48;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // Colors
    const colorPrimary = rgb(0.388, 0.4, 0.945);   // indigo
    const colorDark = rgb(0.067, 0.094, 0.153);
    const colorMuted = rgb(0.42, 0.45, 0.51);
    const colorBorder = rgb(0.898, 0.902, 0.914);
    const colorBg = rgb(0.973, 0.973, 0.984);
    const colorGreen = rgb(0.086, 0.639, 0.294);
    const colorOrange = rgb(0.95, 0.55, 0.1);

    let page = doc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN;

    const newPage = (): PDFPage => {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      return page;
    };

    const ensureSpace = (needed: number) => {
      if (y - needed < MARGIN) newPage();
    };

    const drawText = (
      text: string,
      opts: { font: PDFFont; size: number; color?: ReturnType<typeof rgb>; x?: number; maxWidth?: number },
    ) => {
      const x = opts.x ?? MARGIN;
      const color = opts.color ?? colorDark;
      const maxWidth = opts.maxWidth ?? CONTENT_W;
      // Truncate if needed
      let display = text;
      while (display.length > 0 && opts.font.widthOfTextAtSize(display, opts.size) > maxWidth) {
        display = display.slice(0, -1);
      }
      if (display !== text) display = display.slice(0, -1) + '…';
      page.drawText(display, { x, y, font: opts.font, size: opts.size, color });
    };

    // ── Header ─────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: PAGE_H - 70, width: PAGE_W, height: 70, color: colorPrimary });
    page.drawText('StockHome', { x: MARGIN, y: PAGE_H - 42, font: fontBold, size: 16, color: rgb(1, 1, 1) });
    const titleWidth = fontBold.widthOfTextAtSize(title, 13);
    const titleX = PAGE_W - MARGIN - titleWidth;
    page.drawText(title, { x: titleX, y: PAGE_H - 42, font: fontBold, size: 13, color: rgb(1, 1, 1) });

    const exportDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    page.drawText(`Exported on ${exportDate}`, { x: MARGIN, y: PAGE_H - 58, font: fontRegular, size: 9, color: rgb(0.8, 0.82, 1) });

    y = PAGE_H - 70 - 28;

    // ── Document title ─────────────────────────────────────────────
    drawText(title, { font: fontBold, size: 20, color: colorDark });
    y -= 32;

    const drawContainerNode = (node: ContainerNode, depth: number) => {
      const indent = depth * 16;
      const lineH = 22;
      const iconSize = 8;
      const dotX = MARGIN + indent + 4;

      ensureSpace(lineH + 6);

      // Container row background (subtle for depth > 0)
      if (depth === 0) {
        page.drawRectangle({
          x: MARGIN + indent,
          y: y - 4,
          width: CONTENT_W - indent,
          height: lineH,
          color: colorBg,
          borderColor: colorBorder,
          borderWidth: 0.5,
          opacity: 0.8,
        });
      }

      // Connector dot
      page.drawCircle({ x: dotX, y: y + lineH / 2 - 2, size: iconSize / 2 + (depth === 0 ? 1 : 0), color: colorPrimary, opacity: depth === 0 ? 1 : 0.5 });

      const nameX = dotX + 10;
      drawText(node.container.name, {
        font: depth === 0 ? fontBold : fontRegular,
        size: depth === 0 ? 11 : 10,
        color: depth === 0 ? colorDark : colorMuted,
        x: nameX,
        maxWidth: CONTENT_W - indent - 20,
      });
      y -= lineH;

      // Items in this container
      for (const item of node.items) {
        ensureSpace(18);
        const itemIndent = indent + 20;
        const qtyColor = item.quantity === 0 ? colorOrange : item.quantity > 1 ? colorGreen : colorMuted;

        drawText(`• ${item.name}`, {
          font: fontRegular,
          size: 9,
          color: colorMuted,
          x: MARGIN + itemIndent,
          maxWidth: CONTENT_W - itemIndent - 50,
        });

        const qtyLabel = `× ${item.quantity}`;
        const qtyW = fontBold.widthOfTextAtSize(qtyLabel, 9);
        page.drawText(qtyLabel, {
          x: MARGIN + CONTENT_W - qtyW,
          y,
          font: fontBold,
          size: 9,
          color: qtyColor,
        });
        y -= 16;
      }

      // Child containers
      for (const child of node.children) {
        drawContainerNode(child, depth + 1);
      }

      if (depth === 0) y -= 4;
    };

    for (const roomNode of roomNodes) {
      ensureSpace(40);

      // Room header bar
      page.drawRectangle({ x: MARGIN, y: y - 6, width: CONTENT_W, height: 28, color: colorPrimary, opacity: 0.12 });
      page.drawRectangle({ x: MARGIN, y: y - 6, width: 4, height: 28, color: colorPrimary });
      drawText(roomNode.room.name.toUpperCase(), { font: fontBold, size: 11, color: colorPrimary, x: MARGIN + 12, maxWidth: CONTENT_W - 20 });
      y -= 32;

      // Loose items (not in a container)
      for (const item of roomNode.looseItems) {
        ensureSpace(18);
        const qtyColor = item.quantity === 0 ? colorOrange : item.quantity > 1 ? colorGreen : colorMuted;
        drawText(`• ${item.name}`, { font: fontRegular, size: 9, color: colorMuted, x: MARGIN + 8, maxWidth: CONTENT_W - 60 });
        const qtyLabel = `× ${item.quantity}`;
        const qtyW = fontBold.widthOfTextAtSize(qtyLabel, 9);
        page.drawText(qtyLabel, { x: MARGIN + CONTENT_W - qtyW, y, font: fontBold, size: 9, color: qtyColor });
        y -= 16;
      }

      // Containers
      for (const rootNode of roomNode.rootContainers) {
        drawContainerNode(rootNode, 0);
      }

      y -= 12;
    }

    // Page numbers
    const pages = doc.getPages();
    const total = pages.length;
    pages.forEach((p, i) => {
      p.drawText(`${i + 1} / ${total}`, {
        x: PAGE_W / 2 - 10,
        y: MARGIN / 2,
        font: fontRegular,
        size: 9,
        color: colorMuted,
      });
    });

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }
}
