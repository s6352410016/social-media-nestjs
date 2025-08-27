import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { SendEmailDto } from './dto/send-email.dto';
import { CommonResponse } from 'src/utils/swagger/common-response';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { ForgotPasswordAuthGuard } from 'src/auth/guards/forgot-password-auth.guard';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from 'src/utils/types';

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

  @UseGuards(ForgotPasswordAuthGuard)
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'OTP verified successfully',
    type: CommonResponse,
  })
  verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true })
    res: ExpressResponse,
  ): Promise<CommonResponse> {
    return this.emailService.verifyOtp(
      {
        ...verifyOtpDto,
        email: (
          req.user as JwtPayload<{
            email: string;
          }>
        ).email,
      },
      res,
    );
  }
}
