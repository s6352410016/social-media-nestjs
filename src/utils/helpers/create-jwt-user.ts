import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { User } from "generated/prisma";

export async function createJwtUser(
  user: Omit<User, 'passwordHash'>,
  jwtService: JwtService,
  configService: ConfigService,
) {
  const [accessToken, refreshToken] = await Promise.all([
    jwtService.signAsync(
      {
        id: user.id,
        authVerified: true,
      },
      {
        secret: configService.get<string>('AT_SECRET'),
        expiresIn: '10m',
      },
    ),
    jwtService.signAsync(
      {
        id: user.id,
      },
      {
        secret: configService.get<string>('RT_SECRET'),
        expiresIn: '3d',
      },
    ),
  ]);

  return {
    accessToken,
    refreshToken,
  };
}
