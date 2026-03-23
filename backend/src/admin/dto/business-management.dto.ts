import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export enum AdminManagedBusinessStatus {
  Pending = 'Pending',
  Verified = 'Verified',
  Flagged = 'Flagged',
  Rejected = 'Rejected',
  Inactive = 'Inactive',
}

export class BusinessListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class UpdateBusinessStatusDto {
  @IsEnum(AdminManagedBusinessStatus)
  @IsNotEmpty()
  status: AdminManagedBusinessStatus;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  natureOfBusiness?: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contactMobile?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  signatoryName?: string;

  @IsOptional()
  @IsString()
  signatoryMobile?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  turnover?: number;

  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
