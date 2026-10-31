import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsString()
  email: string;

  @IsString()
  password: string;
}

export class RegisterDto {
  @IsEmail()
  @IsString()
  email: string;

  @IsString()
  @MaxLength(255)
  name?: string;

  @IsString()
  @MinLength(9)
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsString()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(9)
  password: string;
}
