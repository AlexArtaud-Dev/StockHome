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
    const rows = await this.dataSource.query<SearchResult[]>(
      `
      SELECT i.id, i.name, i.description, i.container_id as containerId,
             i.room_id as roomId, i.household_id as householdId,
             i.quantity, i.icon, i.is_consumable as isConsumable
      FROM item i
      INNER JOIN item_fts fts ON fts.rowid = i.rowid
      WHERE fts MATCH ? AND i.household_id = ?
      ORDER BY rank
      LIMIT 50
      `,
      [`"${sanitized}"*`, householdId],
    );

    return rows;
  }
}
