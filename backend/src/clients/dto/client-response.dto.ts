export class ClientResponseDto {
  id: number;
  name: string;
  gstin: string;
  phoneNumber: string;
  email: string;
  clientType: string;
  creditLimit?: number | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
