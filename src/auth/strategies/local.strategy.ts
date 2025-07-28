import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from 'generated/prisma';
import { SignInUserDto } from '../dto/signin-user.dto';
import { validateOrReject } from 'class-validator';
import {
  handleValidationErrorMsg,
  isValidationErrorArray,
} from 'src/utils/validation/validation-error';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(
    username: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const signInObj = new SignInUserDto({ username, password });
    try {
      await validateOrReject(signInObj);
    } catch (error: unknown) {
      if (isValidationErrorArray(error)) {
        const messages = handleValidationErrorMsg(error);
        throw new BadRequestException(`Invalid input: ${messages}`);
      }

      throw new BadRequestException('An unexpected error occurred during validation');
    }

    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
