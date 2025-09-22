import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiPropertyOptional()
  @IsOptional()       
  @IsString()
  @IsNotEmpty()
  message?: string;
}
