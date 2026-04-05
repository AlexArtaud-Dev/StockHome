import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ContainerType } from '@stockhome/shared';

export class CreateContainerDto {
  @IsUUID()
  @IsNotEmpty()
  roomId!: string;

  @IsUUID()
  @IsOptional()
  parentContainerId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['box', 'shelf', 'drawer', 'bag', 'other'])
  type!: ContainerType;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateContainerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['box', 'shelf', 'drawer', 'bag', 'other'])
  @IsOptional()
  type?: ContainerType;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsUUID()
  @IsOptional()
  parentContainerId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
