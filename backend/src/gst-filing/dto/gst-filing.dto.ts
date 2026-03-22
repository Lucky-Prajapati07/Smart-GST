import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

export enum FilingType {
  GSTR1 = 'GSTR1',
  GSTR3B = 'GSTR3B',
  GSTR9 = 'GSTR9',
}

export enum FilingStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  CALCULATED = 'calculated',
  FILED = 'filed',
  SUBMITTED = 'submitted',
}

export class CreateGSTFilingDto {
  @IsString()
  userId: string;

  @IsString()
  filingPeriod: string;

  @IsString()
  filingType: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateGSTFilingDto {
  @IsOptional()
  @IsEnum(FilingStatus)
  status?: string;

  @IsOptional()
  @IsNumber()
  totalSales?: number;

  @IsOptional()
  @IsNumber()
  totalPurchases?: number;

  @IsOptional()
  @IsNumber()
  igst?: number;

  @IsOptional()
  @IsNumber()
  cgst?: number;

  @IsOptional()
  @IsNumber()
  sgst?: number;

  @IsOptional()
  @IsNumber()
  cess?: number;

  @IsOptional()
  @IsNumber()
  itcAvailable?: number;

  @IsOptional()
  @IsNumber()
  taxLiability?: number;

  @IsOptional()
  @IsNumber()
  taxPaid?: number;

  @IsOptional()
  @IsDateString()
  filedDate?: string;

  @IsOptional()
  @IsString()
  arn?: string;

  @IsOptional()
  calculationData?: any;
}

export class CalculateGSTDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  filingPeriod?: string;

  @IsOptional()
  @IsString()
  filingType?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  filingFrequency?: string;

  @IsOptional()
  @IsString()
  filing_frequency?: string;
}

export class ValidateGSTFilingDto {
  @IsString()
  userId: string;
}

export class CreateGSTPaymentDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class MarkGSTPaymentPaidDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class FinalizeGSTFilingDto {
  @IsString()
  userId: string;
}
