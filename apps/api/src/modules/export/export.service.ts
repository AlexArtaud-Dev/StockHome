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
    const HEADER_H = 72;
    const FOOTER_H = 28;

    const colorPrimary = rgb(0.388, 0.4, 0.945);
    const colorDark    = rgb(0.067, 0.094, 0.153);
    const colorMuted   = rgb(0.42, 0.45, 0.51);
    const colorBorder  = rgb(0.878, 0.882, 0.898);
    const colorBg      = rgb(0.965, 0.965, 0.98);
    const colorGreen   = rgb(0.086, 0.639, 0.294);
    const colorOrange  = rgb(0.95, 0.55, 0.1);
    const colorWhite   = rgb(1, 1, 1);
    const colorHeaderSub = rgb(0.78, 0.80, 1);

    let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);

    // y tracks the TOP of the next element to draw (decreases downward)
    let y = PAGE_H;

    const newPage = () => {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    };

    const ensureSpace = (needed: number) => {
      if (y - needed < FOOTER_H + MARGIN) newPage();
    };

    /** Truncate text to fit within maxW at the given size. */
    const fit = (text: string, font: PDFFont, size: number, maxW: number): string => {
      if (font.widthOfTextAtSize(text, size) <= maxW) return text;
      let t = text;
      while (t.length > 0 && font.widthOfTextAtSize(t + '…', size) > maxW) t = t.slice(0, -1);
      return t + '…';
    };

    /**
     * Draw text vertically centred inside a row.
     * rowTop = top edge of the row, rowH = row height.
     * In pdf-lib y is the text baseline. Approximate: baseline = rowTop - rowH/2 - size*0.28
     */
    const drawRowText = (
      text: string,
      font: PDFFont,
      size: number,
      x: number,
      rowTop: number,
      rowH: number,
      color: ReturnType<typeof rgb>,
      maxW: number,
    ) => {
      const baseline = rowTop - rowH / 2 - size * 0.28;
      page.drawText(fit(text, font, size, maxW), { x, y: baseline, font, size, color });
    };

    // ── Page 1 header ──────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: colorPrimary });

    // "StockHome" top-left, date below
    page.drawText('StockHome', {
      x: MARGIN, y: PAGE_H - HEADER_H / 2 - 4,
      font: fontBold, size: 16, color: colorWhite,
    });
    const exportDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    page.drawText(`Exported on ${exportDate}`, {
      x: MARGIN, y: PAGE_H - HEADER_H / 2 + 14,
      font: fontRegular, size: 9, color: colorHeaderSub,
    });

    // Household name — top-right, vertically centred in header
    const hNameW = fontBold.widthOfTextAtSize(title, 13);
    page.drawText(title, {
      x: PAGE_W - MARGIN - hNameW, y: PAGE_H - HEADER_H / 2 - 4,
      font: fontBold, size: 13, color: colorWhite,
    });

    y = PAGE_H - HEADER_H - 24;

    // ── Document title ─────────────────────────────────────────────
    const TITLE_SIZE = 22;
    page.drawText(fit(title, fontBold, TITLE_SIZE, CONTENT_W), {
      x: MARGIN, y,
      font: fontBold, size: TITLE_SIZE, color: colorDark,
    });
    y -= TITLE_SIZE + 20;

    // ── Container node renderer ────────────────────────────────────
    const drawContainerNode = (node: ContainerNode, depth: number) => {
      const indent  = depth * 20;
      const rowH    = depth === 0 ? 26 : 22;
      const dotSize = depth === 0 ? 4 : 3;
      const dotX    = MARGIN + indent + 10;
      const textX   = MARGIN + indent + 22;
      const textMaxW = CONTENT_W - indent - 24 - 50; // leave room for qty on right

      ensureSpace(rowH + 4);

      // Background strip for root containers
      if (depth === 0) {
        page.drawRectangle({
          x: MARGIN,
          y: y - rowH,
          width: CONTENT_W,
          height: rowH,
          color: colorBg,
          borderColor: colorBorder,
          borderWidth: 0.5,
        });
      }

      // Dot — vertically centred in the row
      const dotCY = y - rowH / 2;
      page.drawCircle({ x: dotX, y: dotCY, size: dotSize, color: colorPrimary, opacity: depth === 0 ? 1 : 0.5 });

      // Container name — vertically centred
      drawRowText(
        node.container.name,
        depth === 0 ? fontBold : fontRegular,
        depth === 0 ? 11 : 10,
        textX, y, rowH,
        depth === 0 ? colorDark : colorMuted,
        textMaxW,
      );

      y -= rowH;

      // Items in this container
      const ITEM_H = 18;
      for (const item of node.items) {
        ensureSpace(ITEM_H);
        const itemX   = MARGIN + indent + 24;
        const itemMaxW = CONTENT_W - indent - 26 - 50;
        const qtyColor = item.quantity === 0 ? colorOrange : item.quantity > 1 ? colorGreen : colorMuted;

        // Item name — centred in item row
        drawRowText(`• ${item.name}`, fontRegular, 9, itemX, y, ITEM_H, colorMuted, itemMaxW);

        // Quantity — right-aligned, same baseline
        const qtyLabel = `× ${item.quantity}`;
        const qtyW = fontBold.widthOfTextAtSize(qtyLabel, 9);
        const baseline = y - ITEM_H / 2 - 9 * 0.28;
        page.drawText(qtyLabel, { x: MARGIN + CONTENT_W - qtyW, y: baseline, font: fontBold, size: 9, color: qtyColor });

        y -= ITEM_H;
      }

      // Child containers
      for (const child of node.children) {
        drawContainerNode(child, depth + 1);
      }

      // Gap after root container
      if (depth === 0) y -= 6;
    };

    // ── Rooms ──────────────────────────────────────────────────────
    const ROOM_H  = 30;
    const ITEM_H  = 18;

    for (const roomNode of roomNodes) {
      ensureSpace(ROOM_H + 16);

      // Room header bar
      page.drawRectangle({ x: MARGIN, y: y - ROOM_H, width: CONTENT_W, height: ROOM_H, color: colorPrimary, opacity: 0.1 });
      page.drawRectangle({ x: MARGIN, y: y - ROOM_H, width: 4, height: ROOM_H, color: colorPrimary });

      drawRowText(
        roomNode.room.name.toUpperCase(),
        fontBold, 11,
        MARGIN + 14, y, ROOM_H,
        colorPrimary, CONTENT_W - 20,
      );
      y -= ROOM_H + 4;

      // Loose items
      for (const item of roomNode.looseItems) {
        ensureSpace(ITEM_H);
        const qtyColor = item.quantity === 0 ? colorOrange : item.quantity > 1 ? colorGreen : colorMuted;

        drawRowText(`• ${item.name}`, fontRegular, 9, MARGIN + 10, y, ITEM_H, colorMuted, CONTENT_W - 60);

        const qtyLabel = `× ${item.quantity}`;
        const qtyW = fontBold.widthOfTextAtSize(qtyLabel, 9);
        const baseline = y - ITEM_H / 2 - 9 * 0.28;
        page.drawText(qtyLabel, { x: MARGIN + CONTENT_W - qtyW, y: baseline, font: fontBold, size: 9, color: qtyColor });

        y -= ITEM_H;
      }

      for (const rootNode of roomNode.rootContainers) {
        drawContainerNode(rootNode, 0);
      }

      y -= 16; // gap between rooms
    }

    // ── Page numbers ───────────────────────────────────────────────
    const pages = doc.getPages();
    const total = pages.length;
    pages.forEach((p, i) => {
      const numStr = `${i + 1} / ${total}`;
      const numW = fontRegular.widthOfTextAtSize(numStr, 9);
      p.drawText(numStr, {
        x: PAGE_W / 2 - numW / 2,
        y: FOOTER_H / 2,
        font: fontRegular, size: 9, color: colorMuted,
      });
    });

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }
}
