import { Exclude, Expose } from 'class-transformer';

export class TransactionResponseDto {
  @Expose()
  id: number;

  @Expose()
  transactionType: string;

  @Expose()
  mode: string;

  @Expose()
  amount: string;

  @Expose()
  date: Date;

  @Expose()
  description: string;

  @Expose()
  reference?: number | null;

  @Expose()
  category?: string | null;

  @Expose()
  notes?: string | null;

  @Expose()
  status?: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<TransactionResponseDto>) {
    Object.assign(this, partial);
  }
}
