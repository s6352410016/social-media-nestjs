import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProviderType } from 'generated/prisma';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  password: string;

  @IsOptional()
  @IsString()
  profileUrl?: string;

  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: ProviderType = ProviderType.LOCAL;
}
