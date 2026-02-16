export class InvoiceResponseDto {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  invoiceType: string;
  party: string;
  partyGstin: string;
  amount?: string | null;
  ewayBillNumber?: string | null;
  transportMode?: string | null;
  notes?: string | null;
  gst?: string | null;
  totalAmount?: string | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
