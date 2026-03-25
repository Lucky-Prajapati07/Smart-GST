import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';

export enum SubscriptionPlanType {
  Monthly = 'Monthly',
  HalfYearly = 'HalfYearly',
  Yearly = 'Yearly',
}

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsEnum(SubscriptionPlanType)
  planType: SubscriptionPlanType;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
