import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HouseholdGuard } from '../../common/guards/household.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@Controller('api/v1/search')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query('q') query: string = '', @CurrentUser() user: JwtPayload) {
    return this.searchService.search(query, user.householdId!);
  }
}
