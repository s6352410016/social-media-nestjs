import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Response,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { SendEmailDto } from './dto/send-email.dto';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { Response as ExpressResponse } from 'express';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Email send successfully',
    type: CommonResponse,
  })
  sendEmail(
    @Body() sendEmailDto: SendEmailDto,
    @Response({ passthrough: true })
    res: ExpressResponse,
  ): Promise<CommonResponse> {
    return this.emailService.sendEmail(sendEmailDto, res);
  }
}
