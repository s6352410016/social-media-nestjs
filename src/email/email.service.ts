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
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import { Otp } from 'generated/prisma';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter<
    SMTPTransport.SentMessageInfo,
    SMTPTransport.Options
  >;

  constructor(
    configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: configService.get<string>('GMAIL_USER'),
        pass: configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<CommonResponse> {
    const otp = `${Math.floor(Math.random() * 900000 + 100000)}`; // สร้าง OTP 6 หลัก
    const otpHash = await hashSecret(otp);
    try {
      await this.prismaService.otp.create({
        data: {
          otpHash,
          email: sendEmailDto.email,
          expiresAt: new Date(Date.now() + 600000), // กำหนดให้ OTP หมดอายุใน 10 นาที
        },
      });
      const mailOptions: IEmailOptions = {
        from: '"bynsocial" <bynsocial@email.com>',
        to: sendEmailDto.email,
        subject: 'Verify Your Email',
        html: `<p>Enter <b>${otp}</b> in the page to verify your email address and complete to reset password process.</p>
                  <p>This code <b>expires in 10 minutes</b>.</p>`,
      };
      const result = await this.transporter.sendMail(mailOptions);
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
          message: 'Email already exists',
        };
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to send email',
      };
    }
  }

  async deleteOtp(email: string): Promise<Otp | never> {
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

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<CommonResponse> {
    const { email, otp } = verifyOtpDto;
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
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'OTP verified successfully',
    };
  }
}
