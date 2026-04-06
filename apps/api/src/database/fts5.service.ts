import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class Fts5Service implements OnModuleInit {
  private readonly logger = new Logger(Fts5Service.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.setupFts5();
  }

  private async setupFts5() {
    try {
      await this.dataSource.query(`
        CREATE VIRTUAL TABLE IF NOT EXISTS item_fts
        USING fts5(name, description, content='item', content_rowid='rowid')
      `);

      await this.dataSource.query(`
        CREATE TRIGGER IF NOT EXISTS item_ai AFTER INSERT ON item BEGIN
          INSERT INTO item_fts(rowid, name, description)
          VALUES (new.rowid, new.name, new.description);
        END
      `);

      await this.dataSource.query(`
        CREATE TRIGGER IF NOT EXISTS item_ad AFTER DELETE ON item BEGIN
          INSERT INTO item_fts(item_fts, rowid, name, description)
          VALUES ('delete', old.rowid, old.name, old.description);
        END
      `);

      await this.dataSource.query(`
        CREATE TRIGGER IF NOT EXISTS item_au AFTER UPDATE ON item BEGIN
          INSERT INTO item_fts(item_fts, rowid, name, description)
          VALUES ('delete', old.rowid, old.name, old.description);
          INSERT INTO item_fts(rowid, name, description)
          VALUES (new.rowid, new.name, new.description);
        END
      `);

      this.logger.log('FTS5 virtual table and triggers ready');
    } catch (err) {
      this.logger.error('Failed to set up FTS5', err);
    }
  }
}
