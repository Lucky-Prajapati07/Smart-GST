export class ExpenseResponseDto {
  id: number;
  title: string;
  category: string;
  amount: string;
  gst: string;
  totalAmount?: string;
  vendor?: string;
  paymentMode: string;
  date: Date;
  notes?: string;
  uploadReceipt?: string;
  itc?: string;
  status?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(expense: any) {
    this.id = expense.id;
    this.title = expense.title;
    this.category = expense.category;
    this.amount = expense.amount;
    this.gst = expense.gst;
    this.totalAmount = expense.totalAmount;
    this.vendor = expense.vendor;
    this.paymentMode = expense.paymentMode;
    this.date = expense.date;
    this.notes = expense.notes;
    this.uploadReceipt = expense.uploadReceipt;
    this.itc = expense.itc;
    this.status = expense.status;
    this.description = expense.description;
    this.createdAt = expense.createdAt;
    this.updatedAt = expense.updatedAt;
  }
}
