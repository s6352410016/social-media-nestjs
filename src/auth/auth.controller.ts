import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { ProviderType, User } from 'generated/prisma';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTemporaryRedirectResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { CreateUserDto } from './dto/create-user.dto';
import { SignInUserDto } from './dto/signin-user.dto';
import { AtAuthGuard } from './guards/at-auth.guard';
import { RtAuthGuard } from './guards/rt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ISocialUserPayload, ResetPasswordPayload } from 'src/utils/types';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { ResetPasswordAuthGuard } from './guards/reset-password-auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: SignInUserDto })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: CommonResponse,
  })
  login(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<CommonResponse> {
    return this.authService.login(req.user as Omit<User, 'passwordHash'>, res);
  }

  @Post('register')
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: CommonResponse,
  })
  register(@Body() createUserDto: CreateUserDto): Promise<CommonResponse> {
    return this.authService.register(createUserDto);
  }

  @UseGuards(AtAuthGuard)
  @Get('profile')
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: CommonResponse,
  })
  getProfile(@Request() req: ExpressRequest): CommonResponse {
    const user = req.user as Omit<User, 'passwordHash'>;
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'User profile retrieved successfully',
      data: user,
    };
  }

  @UseGuards(RtAuthGuard)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: CommonResponse,
  })
  refreshToken(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<CommonResponse> {
    const user = req.user as Omit<User, 'passwordHash'>;
    return this.authService.refreshToken(user, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Logged out successfully',
    type: CommonResponse,
  })
  logout(
    @Response({ passthrough: true }) res: ExpressResponse,
  ): CommonResponse {
    return this.authService.logout(res);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google Login' })
  @ApiTemporaryRedirectResponse({
    description: 'Redirect to Google for authentication',
  })
  googleLogin() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Google Login Callback' })
  @ApiFoundResponse({
    description: 'Redirected after google login',
  })
  googleLoginCallback(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.authService.socialLogin(
      req.user as ISocialUserPayload,
      res,
      ProviderType.GOOGLE,
    );
  }

  @UseGuards(GithubAuthGuard)
  @Get('github')
  @ApiOperation({ summary: 'Redirect to github Login' })
  @ApiTemporaryRedirectResponse({
    description: 'Redirect to Github for authentication',
  })
  githubLogin() {}

  @UseGuards(GithubAuthGuard)
  @Get('github/callback')
  @ApiOperation({ summary: 'Github Login Callback' })
  @ApiFoundResponse({
    description: 'Redirected after Github login',
  })
  githubLoginCallback(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.authService.socialLogin(
      req.user as ISocialUserPayload,
      res,
      ProviderType.GITHUB,
    );
  }

  @UseGuards(ResetPasswordAuthGuard)
  @Patch('user/reset-password')
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Reset password successfully',
    type: CommonResponse,
  })
  resetPassword(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<CommonResponse> {
    return this.userService.resetPassword(
      {
        ...resetPasswordDto,
        email: (req.user as ResetPasswordPayload).email,
      },
      res,
    );
  }
}
