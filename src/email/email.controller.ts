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
import { setCookies } from 'src/utils/helpers/set-cookies';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Email send successfully',
    type: CommonResponse,
  })
  async sendEmail(
    @Body() sendEmailDto: SendEmailDto,
    @Response({ passthrough: true })
    res: ExpressResponse,
  ) {
    return await this.emailService.sendEmail(sendEmailDto, res);
  }

  @UseGuards(ForgotPasswordAuthGuard)
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'OTP verified successfully',
    type: CommonResponse,
  })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true })
    res: ExpressResponse,
  ) {
    const result = await this.emailService.verifyOtp(
      {
        ...verifyOtpDto,
        email: (
          req.user as JwtPayload<{
            email: string;
          }>
        ).email,
      },
    );

    if(result.message && !result.token){
      return {
        message: result.message,
      };
    }

    if (result.token && !result.message) {
      setCookies('reset_password_token', result.token, res);
      res.clearCookie('forgot_password_token');

      return {
        message: 'Otp verified successfully',
      };
    }
  }
}
