import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy } from './strategies/at.strategy';
import { RtStrategy } from './strategies/rt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { ResetPasswordStrategy } from './strategies/reset-password.strategy';

@Module({
  imports: [
    UserModule, 
    PassportModule, 
    JwtModule.register({})
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    AtStrategy,
    RtStrategy,
    GoogleStrategy,
    GithubStrategy,
    ResetPasswordStrategy,
  ],
})
export class AuthModule {}
