import { IsString, IsEmail, IsOptional, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsNotEmpty()
  @IsString()
  gstin: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  clientType: string; // 'Customer', 'Supplier'

  @IsOptional()
  @IsInt()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsString()
  stateCode?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  shippingGstin?: string;

  @IsOptional()
  @IsString()
  shippingState?: string;

  @IsOptional()
  @IsString()
  shippingStateCode?: string;

  @IsOptional()
  @IsString()
  shippingPincode?: string;
}
