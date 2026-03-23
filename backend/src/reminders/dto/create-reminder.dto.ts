import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReminderDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledFor: string;

  @IsNotEmpty()
  @IsEmail()
  recipientEmail: string;
}
