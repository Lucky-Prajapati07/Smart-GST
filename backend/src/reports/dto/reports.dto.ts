import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum ReportType {
  SALES = 'sales',
  PURCHASE = 'purchase',
  GST = 'gst',
  PROFIT_LOSS = 'profit-loss',
  EXPENSE = 'expense',
  CLIENT = 'client',
  TRANSACTION = 'transaction',
}

export enum ReportPeriod {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class GenerateReportDto {
  @IsString()
  userId: string;

  @IsEnum(ReportType)
  reportType: string;

  @IsString()
  reportName: string;

  @IsEnum(ReportPeriod)
  period: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  parameters?: any;
}
