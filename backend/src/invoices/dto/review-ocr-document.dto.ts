import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import type { OcrExtractedInvoiceDto } from './ocr-extract-response.dto';

export class ReviewOcrDocumentDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsOptional()
  @IsBoolean()
  createClientIfMissing?: boolean;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @IsNotEmpty()
  @IsObject()
  approvedInvoice!: OcrExtractedInvoiceDto;
}

export class ReviewOcrDocumentResponseDto {
  documentId!: number;
  reviewStatus!: 'Approved' | 'Rejected';
  reviewedAt!: string;
  approvedInvoice!: OcrExtractedInvoiceDto;
  clientResolution!: {
    status: 'matched' | 'created' | 'none';
    clientId?: number;
    clientName?: string;
    clientGstin?: string;
  };
}
