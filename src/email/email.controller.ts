import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { SendEmailDto } from './dto/send-email.dto';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Email send successfully',
    type: CommonResponse,
  })
  sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<CommonResponse> {
    return this.emailService.sendEmail(sendEmailDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'OTP verified successfully',
    type: CommonResponse,
  })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<CommonResponse> {
    return this.emailService.verifyOtp(verifyOtpDto);
  }
}
