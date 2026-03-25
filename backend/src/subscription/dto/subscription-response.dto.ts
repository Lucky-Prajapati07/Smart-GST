export class SubscriptionResponseDto {
  id: number;
  userId: string;
  planType: string;
  price: string;
  currency: string;
  status: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
