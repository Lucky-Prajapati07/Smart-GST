import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['email'], { message: 'Only email method is supported' })
  method: 'email';

  @IsString()
  purpose?: string;
}
