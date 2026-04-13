import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  containerId: string | null;
  roomId: string;
  householdId: string;
  quantity: number;
  icon: string | null;
  isConsumable: boolean;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async search(query: string, householdId: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    // FTS5 search via raw query
    const sanitized = query.replace(/["']/g, '');
    // FTS5 virtual-table MATCH requires the literal table name — aliasing it
    // causes "no such column" errors. Use a correlated subquery instead.
    const rows = await this.dataSource.query<SearchResult[]>(
      `
      SELECT i.id, i.name, i.description, i.containerId,
             i.roomId, i.householdId,
             i.quantity, i.icon, i.isConsumable
      FROM item i
      WHERE i.rowid IN (
        SELECT rowid FROM item_fts WHERE item_fts MATCH ?
      )
      AND i.householdId = ?
      ORDER BY i.name
      LIMIT 50
      `,
      [`"${sanitized}"*`, householdId],
    );

    return rows;
  }
}
