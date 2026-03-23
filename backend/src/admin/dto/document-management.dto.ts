import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AdminManagedDocumentStatus {
  Pending = 'Pending',
  Verified = 'Verified',
  Flagged = 'Flagged',
}

export class DocumentListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class UpdateDocumentStatusDto {
  @IsEnum(AdminManagedDocumentStatus)
  @IsNotEmpty()
  status: AdminManagedDocumentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
