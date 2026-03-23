import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  role?: string = 'admin';

  @IsString()
  @IsOptional()
  status?: string = 'Active';
}
