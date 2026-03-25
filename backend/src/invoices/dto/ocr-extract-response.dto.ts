export type OcrLineItemDto = {
  itemName: string;
  hsnCode: string;
  quantity: number;
  price: number;
  discount: number;
  taxRate: number;
  amount: number;
};

export type OcrExtractedInvoiceDto = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  invoiceType: string;
  party: string;
  partyGstin: string;
  recipientLegalName?: string;
  recipientAddress?: string;
  recipientStateCode?: string;
  placeOfSupplyStateCode?: string;
  recipientPincode?: string;
  ewayBillNumber?: string;
  notes?: string;
  amount: string;
  gst: string;
  totalAmount: string;
  status: string;
  items: OcrLineItemDto[];
};

export class OcrExtractResponseDto {
  documentId: number;
  fileName: string;
  mimeType: string;
  ocrEngine: string;
  confidence: number;
  extractedTextPreview: string;
  invoice: OcrExtractedInvoiceDto;
  clientResolution?: {
    status: 'matched' | 'created' | 'none';
    clientId?: number;
    name?: string;
    gstin?: string;
  };
}
