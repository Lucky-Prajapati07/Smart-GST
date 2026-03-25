import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlanType } from './create-subscription.dto';

export class VerifyRazorpayPaymentDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsEnum(SubscriptionPlanType)
  planType: SubscriptionPlanType;

  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
