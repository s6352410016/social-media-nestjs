import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { ProviderType, Role, User } from 'generated/prisma';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { Response as ExpressResponse } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateSocialUserDto, ISocialUserPayload } from 'src/utils/types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  clearCookies(res: ExpressResponse, ...cookieKeys: string[]) {
    cookieKeys.forEach((key) => {
      res.clearCookie(key);
    });
  }

  setCookies(
    key: string[] | string,
    value: string[] | string,
    res: ExpressResponse,
  ) {
    if (Array.isArray(key) && Array.isArray(value)) {
      key.forEach((k, index) => {
        res.cookie(k, value[index], {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        });
      });
    } else if (typeof key === 'string' && typeof value === 'string') {
      res.cookie(key, value, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
    }
  }

  async createJWTAndSetCookies(
    user: Omit<User, 'passwordHash'>,
    res: ExpressResponse,
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: user.id,
        },
        {
          secret: this.configService.get<string>('AT_SECRET'),
          expiresIn: '10m',
        },
      ),
      this.jwtService.signAsync(
        {
          id: user.id,
        },
        {
          secret: this.configService.get<string>('RT_SECRET'),
          expiresIn: '1h',
        },
      ),
    ]);

    this.setCookies(
      ['access_token', 'refresh_token'],
      [accessToken, refreshToken],
      res,
    );
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.userService.findOne(username);
    if (
      user &&
      user.provider?.providerType === ProviderType.LOCAL &&
      user.passwordHash &&
      (await bcrypt.compare(password, user.passwordHash))
    ) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  async login(
    user: Omit<User, 'passwordHash'>,
    res: ExpressResponse,
  ): Promise<CommonResponse> {
    await this.createJWTAndSetCookies(user, res);
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Login successful',
    };
  }

  async register(createUserDto: CreateUserDto): Promise<CommonResponse> {
    const user = await this.userService.createUser(createUserDto);
    return {
      status: HttpStatus.CREATED,
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  async refreshToken(
    user: Omit<User, 'passwordHash'>,
    res: ExpressResponse,
  ): Promise<CommonResponse> {
    await this.createJWTAndSetCookies(user, res);
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Tokens refreshed successfully',
    };
  }

  logout(res: ExpressResponse): CommonResponse {
    this.clearCookies(res, 'access_token', 'refresh_token');
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Logged out successfully',
    };
  }

  async socialLogin(
    user: ISocialUserPayload,
    res: ExpressResponse,
    providerType: ProviderType,
  ) {
    const userExist = await this.userService.findByEmail(user.email);
    const CLIENT_URL = this.configService.get<string>('CLIENT_URL');
    const CLIENT_REDIRECT_SUCCESS_URL = `${CLIENT_URL}${this.configService.get<string>('CLIENT_REDIRECT_SUCCESS_PATH')}`;
    const CLIENT_REDIRECT_ERROR_URL = `${CLIENT_URL}${this.configService.get<string>('CLIENT_REDIRECT_ERROR_PATH')}`;
    const msg = "email already registered with a different provider";

    // กรณีที่ผู้ใช้มีอยู่แล้ว
    if (providerType === ProviderType.GOOGLE && userExist) {
      if (userExist.provider?.providerType !== ProviderType.GOOGLE) {
        return res.redirect(`${CLIENT_REDIRECT_ERROR_URL}?message=${encodeURIComponent(msg)}`);
      }

      await this.createJWTAndSetCookies(userExist, res);
      return res.redirect(CLIENT_REDIRECT_SUCCESS_URL);
    } else if (providerType === ProviderType.GITHUB && userExist) {
      if (userExist.provider?.providerType !== ProviderType.GITHUB) {
        return res.redirect(`${CLIENT_REDIRECT_ERROR_URL}?message=${encodeURIComponent(msg)}`);
      }

      await this.createJWTAndSetCookies(userExist, res);
      return res.redirect(CLIENT_REDIRECT_SUCCESS_URL);
    } else {
      // กรณีที่ผู้ใช้ยังไม่มีในระบบ
      const createSocialUserDto: CreateSocialUserDto = {
        fullname: user.name,
        email: user.email,
        providerType,
        providerId: user.providerId,
        profileUrl: user.avatar,
      };
      const userData = await this.userService.createUser(createSocialUserDto);
      await this.createJWTAndSetCookies(userData, res);
      return res.redirect(CLIENT_REDIRECT_SUCCESS_URL);
    }
  }
}
