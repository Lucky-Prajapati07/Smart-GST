import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AdminFilingStatus {
  draft = 'draft',
  validated = 'validated',
  calculated = 'calculated',
  filed = 'filed',
  submitted = 'submitted',
}

export class FilingListQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  filingType?: string;

  @IsOptional()
  @IsString()
  dateRange?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class UpdateFilingStatusDto {
  @IsEnum(AdminFilingStatus)
  @IsNotEmpty()
  status: AdminFilingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
