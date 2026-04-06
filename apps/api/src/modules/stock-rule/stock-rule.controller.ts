import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { StockRuleService } from './stock-rule.service';
import { UpsertStockRuleDto } from './stock-rule.dto';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class StockRuleController {
  constructor(private readonly stockRuleService: StockRuleService) {}

  @Get('shopping-list')
  getShoppingList(@CurrentUser() user: JwtPayload) {
    return this.stockRuleService.getShoppingList(user.householdId);
  }

  @Put('items/:itemId/stock-rule')
  upsert(
    @Param('itemId') itemId: string,
    @Body() dto: UpsertStockRuleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.stockRuleService.upsert(itemId, dto, user.householdId);
  }

  @Delete('items/:itemId/stock-rule')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('itemId') itemId: string, @CurrentUser() user: JwtPayload) {
    return this.stockRuleService.remove(itemId, user.householdId);
  }

  @Post('items/:itemId/stock-rule/renew')
  markRenewed(@Param('itemId') itemId: string, @CurrentUser() user: JwtPayload) {
    return this.stockRuleService.markRenewed(itemId, user.householdId);
  }
}
