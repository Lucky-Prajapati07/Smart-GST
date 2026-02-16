import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsDecimal } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsNotEmpty()
  businessType: string;

  @IsString()
  @IsOptional()
  natureOfBusiness?: string;

  @IsString()
  @IsNotEmpty()
  pan: string;

  @IsString()
  @IsNotEmpty()
  gstin: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  pincode: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsNotEmpty()
  contactMobile: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsNotEmpty()
  signatoryName: string;

  @IsString()
  @IsNotEmpty()
  signatoryMobile: string;

  @IsString()
  @IsOptional()
  panCardUrl?: string;

  @IsString()
  @IsOptional()
  gstCertificateUrl?: string;

  @IsString()
  @IsOptional()
  businessLicenseUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  turnover?: number;
}

export class UpdateBusinessDto {
  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  natureOfBusiness?: string;

  @IsString()
  @IsOptional()
  pan?: string;

  @IsString()
  @IsOptional()
  gstin?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  pincode?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  contactMobile?: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  signatoryName?: string;

  @IsString()
  @IsOptional()
  signatoryMobile?: string;

  @IsString()
  @IsOptional()
  panCardUrl?: string;

  @IsString()
  @IsOptional()
  gstCertificateUrl?: string;

  @IsString()
  @IsOptional()
  businessLicenseUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  turnover?: number;
}
