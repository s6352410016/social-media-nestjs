import { JwtService } from '@nestjs/jwt';

export function createJwt(
  payload: Object,
  secret: string,
  jwtService: JwtService,
): Promise<string> {
  return jwtService.signAsync(payload, {
    secret,
  });
}
