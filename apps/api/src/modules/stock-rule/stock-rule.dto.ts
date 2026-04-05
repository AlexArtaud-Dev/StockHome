import { IsInt, IsOptional, Min } from 'class-validator';

export class UpsertStockRuleDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  minQuantity?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  renewalIntervalDays?: number;
}
