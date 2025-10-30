import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ICookieObject, JwtPayload } from 'src/utils/types';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket<any, any, any, { token: Omit<ICookieObject, 'refresh_token'> }>>();
    const { access_token } = client.data.token;
    if (access_token) {
      try {
        const payload =
          this.jwtService.verify<
            JwtPayload<{ id: string; authVerified: boolean }>
          >(access_token);

        if (payload && payload.id) {
          return true;
        }

        throw new WsException('WS invalid or expired credentials');
      } catch (error: unknown) {
        if (error instanceof TokenExpiredError) {
          throw new WsException('WS invalid or expired credentials');
        }

        throw new WsException('WS invalid or expired credentials');
      }
    }

    throw new WsException('WS invalid or expired credentials');
  }
}
