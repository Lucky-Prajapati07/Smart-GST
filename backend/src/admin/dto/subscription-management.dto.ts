import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdminManagedUserPlan } from './user-management.dto';

export enum AdminSubscriptionPlanType {
  Monthly = 'Monthly',
  HalfYearly = 'HalfYearly',
  Yearly = 'Yearly',
}

export enum AdminSubscriptionStatus {
  Active = 'Active',
  Expired = 'Expired',
  Cancelled = 'Cancelled',
  Pending = 'Pending',
}

export class AdminSubscriptionListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  planType?: string;

  @IsOptional()
  @IsString()
  accessType?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class UpdateAdminSubscriptionDto {
  @IsOptional()
  @IsEnum(AdminSubscriptionStatus)
  status?: AdminSubscriptionStatus;

  @IsOptional()
  @IsEnum(AdminSubscriptionPlanType)
  planType?: AdminSubscriptionPlanType;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(AdminManagedUserPlan)
  userPlan?: AdminManagedUserPlan;

  @IsOptional()
  @IsBoolean()
  isTrialActive?: boolean;

  @IsOptional()
  @IsDateString()
  trialEndDate?: string;
}
