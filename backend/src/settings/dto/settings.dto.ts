import { IsString, IsOptional, IsBoolean, IsInt, IsEmail } from 'class-validator';

export class CreateSettingsDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  ifsc?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  invoicePrefix?: string;

  @IsOptional()
  @IsInt()
  dueDays?: number;

  @IsOptional()
  @IsString()
  invoiceFooter?: string;

  @IsOptional()
  @IsString()
  invoiceTemplate?: string;

  @IsOptional()
  @IsBoolean()
  einvoiceEnabled?: boolean;

  @IsOptional()
  @IsString()
  termsConditions?: string;

  @IsOptional()
  @IsBoolean()
  gstr1Alerts?: boolean;

  @IsOptional()
  @IsBoolean()
  gstr3bAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentDueAlerts?: boolean;

  @IsOptional()
  @IsInt()
  remindBeforeDays?: number;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappNotifications?: boolean;

  @IsOptional()
  @IsEmail()
  notificationEmail?: string;

  @IsOptional()
  @IsString()
  notificationPhone?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  currencyFormat?: string;

  @IsOptional()
  @IsString()
  numberFormat?: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  ifsc?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  invoicePrefix?: string;

  @IsOptional()
  @IsInt()
  dueDays?: number;

  @IsOptional()
  @IsString()
  invoiceFooter?: string;

  @IsOptional()
  @IsString()
  invoiceTemplate?: string;

  @IsOptional()
  @IsBoolean()
  einvoiceEnabled?: boolean;

  @IsOptional()
  @IsString()
  termsConditions?: string;

  @IsOptional()
  @IsBoolean()
  gstr1Alerts?: boolean;

  @IsOptional()
  @IsBoolean()
  gstr3bAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentDueAlerts?: boolean;

  @IsOptional()
  @IsInt()
  remindBeforeDays?: number;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappNotifications?: boolean;

  @IsOptional()
  @IsEmail()
  notificationEmail?: string;

  @IsOptional()
  @IsString()
  notificationPhone?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  currencyFormat?: string;

  @IsOptional()
  @IsString()
  numberFormat?: string;
}
