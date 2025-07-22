import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { IJwtPayload } from 'src/utils/types';
import { UserService } from 'src/user/user.service';
import { User } from 'generated/prisma';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'access-token') {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: ExpressRequest) => {
          const token = req?.cookies?.['access_token'];
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('AT_SECRET')!,
    });
  }

  validate(payload: IJwtPayload): Promise<Omit<User, 'passwordHash'> | null> {
    return this.userService.findById(payload.id);
  }
}
