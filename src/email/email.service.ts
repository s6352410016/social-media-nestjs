import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendEmailDto } from './dto/send-email.dto';
import { hashSecret } from 'src/utils/helpers/hash-secret';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { IEmailOptions } from 'src/utils/types';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Otp } from 'generated/prisma';
import { JwtService } from '@nestjs/jwt';
import { Response as ExpressResponse } from 'express';
import { setCookies } from 'src/utils/helpers/set-cookies';
import { createJwt } from 'src/utils/helpers/create-jwt';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter<
    SMTPTransport.SentMessageInfo,
    SMTPTransport.Options
  >;

  constructor(
    configService: ConfigService,
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configServiceP: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: configService.get<string>('GMAIL_USER'),
        pass: configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendEmail(
    sendEmailDto: SendEmailDto,
    res: ExpressResponse,
  ): Promise<CommonResponse> {
    const { email } = sendEmailDto;
    const otp = `${Math.floor(Math.random() * 900000 + 100000)}`; // สร้าง OTP 6 หลัก
    const otpHash = await hashSecret(otp);
    try {
      await this.prismaService.otp.create({
        data: {
          otpHash,
          email,
          expiresAt: new Date(Date.now() + 600000), // กำหนดให้ OTP หมดอายุใน 10 นาที
        },
      });
      const mailOptions: IEmailOptions = {
        from: '"bynsocial" <bynsocial@email.com>',
        to: email,
        subject: 'Verify Your Email',
        html: `<p>Enter <b>${otp}</b> in the page to verify your email address and complete to reset password process.</p>
                  <p>This code <b>expires in 10 minutes</b>.</p>`,
      };
      const result = await this.transporter.sendMail(mailOptions);
      const token = await createJwt(
        {
          email,
          sendEmailVerified: true,
        },
        this.configServiceP.get<string>('FORGOT_PASSWORD_SECRET')!,
        this.jwtService,
      );
      setCookies('forgot_password_token', token, res);
      return {
        status: HttpStatus.OK,
        success: true,
        message: `Email send to ${result.accepted[0]} successfully`,
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          status: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Otp already exist in your email',
        };
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to send email',
      };
    }
  }

  async deleteOtp(email: string): Promise<Otp> {
    try {
      return await this.prismaService.otp.delete({
        where: { email },
      });
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`OTP for email ${email} not found`);
      }

      throw new InternalServerErrorException('Failed to delete OTP');
    }
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
    res: ExpressResponse,
  ): Promise<CommonResponse> {
    const { email, otp } = verifyOtpDto;
    try {
      const otpRecord = await this.prismaService.otp.findFirst({
        where: {
          email,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpRecord) {
        await this.deleteOtp(email);

        return {
          status: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'OTP not found or expired',
        };
      }

      const isOtpValid = await bcrypt.compare(otp, otpRecord.otpHash);

      if (!isOtpValid) {
        return {
          status: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Invalid OTP',
        };
      }

      await this.deleteOtp(email);
      const token = await createJwt(
        {
          email,
          otpVerified: true,
        },
        this.configServiceP.get<string>('RESET_PASSWORD_SECRET')!,
        this.jwtService,
      );
      setCookies('reset_password_token', token, res);
      res.clearCookie('forgot_password_token');

      return {
        status: HttpStatus.OK,
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to verify otp',
      };
    }
  }
}
