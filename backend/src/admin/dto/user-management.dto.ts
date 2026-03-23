import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum AdminManagedUserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending',
  Rejected = 'Rejected',
}

export enum AdminManagedUserPlan {
  Basic = 'Basic',
  Pro = 'Pro',
  Enterprise = 'Enterprise',
}

export class CreateManagedUserDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsEnum(AdminManagedUserStatus)
  status?: AdminManagedUserStatus;

  @IsOptional()
  @IsEnum(AdminManagedUserPlan)
  plan?: AdminManagedUserPlan;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  gstin?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  business?: string;

  @IsString()
  @IsOptional()
  gstin?: string;

  @IsEnum(AdminManagedUserStatus)
  @IsOptional()
  status?: AdminManagedUserStatus;

  @IsEnum(AdminManagedUserPlan)
  @IsOptional()
  plan?: AdminManagedUserPlan;
}

export class UpdateUserStatusDto {
  @IsEnum(AdminManagedUserStatus)
  @IsNotEmpty()
  status: AdminManagedUserStatus;
}

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ImpersonateUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class UserListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AdminManagedUserStatus)
  status?: AdminManagedUserStatus;

  @IsOptional()
  @IsEnum(AdminManagedUserPlan)
  plan?: AdminManagedUserPlan;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class DashboardStatsDto {
  totalUsers: number;
  activeUsers: number;
  totalFilings: number;
  pendingFilings: number;
  totalInvoices: number;
  revenue: number;
}

export class UserDto {
  id: string;
  name: string;
  email: string;
  business: string;
  gstin: string;
  mobile: string;
  signupDate: string;
  lastLogin: string | null;
  status: AdminManagedUserStatus;
  plan: AdminManagedUserPlan;
  filings: number;
  invoices: number;
}

export class AdminResponseDto {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}
