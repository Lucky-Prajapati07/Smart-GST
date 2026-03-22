export class ClientResponseDto {
  id: number;
  name: string;
  legalName?: string | null;
  gstin: string;
  phoneNumber: string;
  email: string;
  contactPerson?: string | null;
  clientType: string;
  creditLimit?: number | null;
  address?: string | null;
  place?: string | null;
  stateCode?: string | null;
  pincode?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  shippingGstin?: string | null;
  shippingState?: string | null;
  shippingStateCode?: string | null;
  shippingPincode?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
