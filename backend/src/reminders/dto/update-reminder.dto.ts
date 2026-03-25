import { IsDateString, IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const REMINDER_STATUSES = ['Pending', 'Completed', 'Sent', 'Cancelled', 'Failed'] as const;
export type ReminderStatusValue = (typeof REMINDER_STATUSES)[number];

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsIn(REMINDER_STATUSES)
  status?: ReminderStatusValue;
}
