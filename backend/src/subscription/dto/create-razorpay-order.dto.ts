import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SubscriptionPlanType } from './create-subscription.dto';

export class CreateRazorpayOrderDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsEnum(SubscriptionPlanType)
  planType: SubscriptionPlanType;
}
