import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { User } from 'generated/prisma';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommonResponse } from 'src/utils/swagger/CommonResponse';
import { CreateUserDto } from './dto/create-user.dto';
import { SignInUserDto } from './dto/signin-user.dto';
import { AtAuthGuard } from './guards/at-auth.guard';
import { RtAuthGuard } from './guards/rt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
    return this.authService.login(
      req.user as unknown as Omit<User, 'passwordHash'>,
      res,
    );
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
    const user = req.user as unknown as Omit<User, 'passwordHash'>;
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'User profile retrieved successfully',
      data: user,
    }
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
    const user = req.user as unknown as Omit<User, 'passwordHash'>;
    return this.authService.refreshToken(user, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Logged out successfully',
    type: CommonResponse,
  })
  logout(@Response({ passthrough: true }) res: ExpressResponse): CommonResponse {
    return this.authService.logout(res);
  }
}
