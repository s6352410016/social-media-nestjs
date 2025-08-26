import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { JwtPayload } from 'src/utils/types';

@Injectable()
export class ForgotPasswordStrategy extends PassportStrategy(
  Strategy,
  'forgot-password-jwt',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: ExpressRequest) => {
          const token = req?.cookies?.['forgot_password_token'];
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('FORGOT_PASSWORD_SECRET')!,
    });
  }

  validate(
    payload: JwtPayload<{
      email: string;
    }>,
  ): JwtPayload<{
    email: string;
  }> {
    return payload;
  }
}
