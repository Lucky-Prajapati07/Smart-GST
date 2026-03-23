import { IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @IsString()
  adminId: string;

  @IsString()
  action: string;

  @IsString()
  targetType: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  targetEmail?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  changes?: any;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class AuditLogQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  adminId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class UpdateSystemSettingsDto {
  @IsOptional()
  maxUsersLimit?: number;

  @IsOptional()
  maxInvoicesPerUser?: number;

  @IsOptional()
  maxGstFilingsPerUser?: number;

  @IsOptional()
  maintenanceMode?: boolean;

  @IsOptional()
  maintenanceMessage?: string;

  @IsOptional()
  enableUserSignups?: boolean;

  @IsOptional()
  emailVerificationRequired?: boolean;

  @IsOptional()
  autoGstCalculation?: boolean;

  @IsOptional()
  auditLoggingEnabled?: boolean;

  @IsOptional()
  sessionTimeout?: number;

  @IsOptional()
  maxLoginAttempts?: number;

  @IsOptional()
  passwordExpiryDays?: number;
}
