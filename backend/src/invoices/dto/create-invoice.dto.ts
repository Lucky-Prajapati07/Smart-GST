import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  invoiceNumber: string;

  @IsNotEmpty()
  @IsDateString()
  invoiceDate: string;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  documentTypeCode?: string;

  @IsOptional()
  @IsDateString()
  documentDate?: string;

  @IsOptional()
  @IsString()
  precedingInvoiceReference?: string;

  @IsOptional()
  @IsDateString()
  precedingInvoiceDate?: string;

  @IsNotEmpty()
  @IsString()
  invoiceType: string; // 'Sales', 'Purchase'

  @IsOptional()
  @IsString()
  supplyTypeCode?: string;

  @IsOptional()
  @IsString()
  isService?: string;

  @IsOptional()
  @IsString()
  supplierLegalName?: string;

  @IsOptional()
  @IsString()
  supplierAddress?: string;

  @IsOptional()
  @IsString()
  supplierPlace?: string;

  @IsOptional()
  @IsString()
  supplierStateCode?: string;

  @IsOptional()
  @IsString()
  supplierPincode?: string;

  @IsNotEmpty()
  @IsString()
  party: string; // Client or Supplier name

  @IsNotEmpty()
  @IsString()
  partyGstin: string;

  @IsOptional()
  @IsString()
  recipientLegalName?: string;

  @IsOptional()
  @IsString()
  recipientAddress?: string;

  @IsOptional()
  @IsString()
  recipientStateCode?: string;

  @IsOptional()
  @IsString()
  placeOfSupplyStateCode?: string;

  @IsOptional()
  @IsString()
  recipientPincode?: string;

  @IsOptional()
  @IsString()
  recipientPlace?: string;

  @IsOptional()
  @IsString()
  irn?: string;

  @IsOptional()
  @IsString()
  shippingToGstin?: string;

  @IsOptional()
  @IsString()
  shippingToState?: string;

  @IsOptional()
  @IsString()
  shippingToStateCode?: string;

  @IsOptional()
  @IsString()
  shippingToPincode?: string;

  @IsOptional()
  @IsString()
  dispatchFromName?: string;

  @IsOptional()
  @IsString()
  dispatchFromAddress?: string;

  @IsOptional()
  @IsString()
  dispatchFromPlace?: string;

  @IsOptional()
  @IsString()
  dispatchFromPincode?: string;

  @IsOptional()
  @IsArray()
  items?: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  assessableValue?: string;

  @IsOptional()
  @IsString()
  gstRate?: string;

  @IsOptional()
  @IsString()
  igstValue?: string;

  @IsOptional()
  @IsString()
  cgstValue?: string;

  @IsOptional()
  @IsString()
  sgstValue?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  ewayBillNumber?: string;

  @IsOptional()
  @IsString()
  transportMode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  gst?: string;

  @IsOptional()
  @IsString()
  totalAmount?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
