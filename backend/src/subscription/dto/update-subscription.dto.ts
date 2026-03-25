import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { SubscriptionPlanType } from './create-subscription.dto';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionPlanType)
  planType?: SubscriptionPlanType;

  @IsOptional()
  price?: number;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
