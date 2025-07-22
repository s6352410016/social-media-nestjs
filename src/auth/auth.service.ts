import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { User } from 'generated/prisma';
import { CommonResponse } from 'src/utils/swagger/CommonResponse';
import { Response as ExpressResponse } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  clearCookies(res: ExpressResponse, ...cookieKeys: string[]){
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

  async createJWT(user: Omit<User, 'passwordHash'>, res: ExpressResponse) {
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
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  async login(
    user: Omit<User, 'passwordHash'>,
    res: ExpressResponse,
  ): Promise<CommonResponse> {
    await this.createJWT(user, res);
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Login successful',
    };
  }

  async register(createUserDto: CreateUserDto): Promise<CommonResponse> {
    const user = await this.userService.createUser(createUserDto);
    const { passwordHash, ...result } = user;
    return {
      status: HttpStatus.CREATED,
      success: true,
      message: 'User created successfully',
      data: result,
    };
  }

  async refreshToken(
    user: Omit<User, 'passwordHash'>,
    res: ExpressResponse,
  ): Promise<CommonResponse> {
    await this.createJWT(user, res);
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
}
