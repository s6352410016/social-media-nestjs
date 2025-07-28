import { HttpStatus } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CommonResponse {
  @ApiPropertyOptional({ enum: HttpStatus })
  status?: HttpStatus;

  @ApiPropertyOptional()
  success?: boolean;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional({
    oneOf: [
      { type: 'object', additionalProperties: true },
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: { type: 'any' } },
      { type: 'null' }, 
    ],
  })
  data?: any;
}
