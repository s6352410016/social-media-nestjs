import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { ResetPasswordPayload } from 'src/utils/types';

@Injectable()
export class ResetPasswordStrategy extends PassportStrategy(Strategy, 'reset-password-jwt') {
  constructor(
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: ExpressRequest) => {
          const token = req?.cookies?.['reset_password_token'];
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('RESET_PASSWORD_SECRET')!,
    });
  }

  validate(payload: ResetPasswordPayload): ResetPasswordPayload {
    return payload;
  }
}
