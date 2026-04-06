import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockRuleEntity } from '../../database/entities/stock-rule.entity';
import { ItemEntity } from '../../database/entities/item.entity';
import { StockRuleController } from './stock-rule.controller';
import { StockRuleService } from './stock-rule.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockRuleEntity, ItemEntity])],
  controllers: [StockRuleController],
  providers: [StockRuleService],
})
export class StockRuleModule {}
