import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const adminNotificationTargetGroups = [
  'all',
  'verified',
  'unverified',
  'pro',
  'enterprise',
  'inactive',
] as const;

export type AdminNotificationTargetGroup =
  (typeof adminNotificationTargetGroups)[number];

export class CreateAdminNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsIn(adminNotificationTargetGroups)
  targetGroup: AdminNotificationTargetGroup;

  @IsArray()
  @IsString({ each: true })
  deliveryTypes: string[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class NotificationListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  targetGroup?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class UserNotificationsQueryDto {
  @IsOptional()
  @IsString()
  onlyUnread?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
