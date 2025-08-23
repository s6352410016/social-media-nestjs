import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommonResponse {
  @ApiProperty()
  status: number;

  @ApiProperty()
  success: boolean;

  @ApiProperty({
    oneOf: [
      { type: 'object', additionalProperties: true },
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: { type: 'any' } },
    ],
  })
  message:
    | Object
    | string
    | number
    | boolean
    | Array<Object | string | number | boolean>;

  @ApiPropertyOptional({
    oneOf: [
      { type: 'object', additionalProperties: true },
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: { type: 'any' } },
    ],
  })
  data?:
    | Object
    | string
    | number
    | boolean
    | Array<Object | string | number | boolean>;
}
