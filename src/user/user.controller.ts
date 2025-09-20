import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ResetPasswordAuthGuard } from 'src/auth/guards/reset-password-auth.guard';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { UserService } from './user.service';
import { JwtPayload, ResponseFromService } from 'src/utils/types';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AtAuthGuard } from 'src/auth/guards/at-auth.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(ResetPasswordAuthGuard)
  @Patch('reset-password')
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Reset password successfully',
    type: CommonResponse,
  })
  async resetPassword(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResponseFromService> {
    await this.userService.resetPassword(
      {
        ...resetPasswordDto,
        email: (
          req.user as JwtPayload<{
            email: string;
          }>
        ).email,
      },
    );
    res.clearCookie('reset_password_token');
    return {
      message: 'Reset password successfully',
    }
  }

  @UseGuards(AtAuthGuard)
  @Get('find-by-fullname/:currentId')
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Users retreived successfully',
    type: CommonResponse,
  })
  async findByFullname(
    @Param('currentId', ParseIntPipe) currentId: number,
    @Query('fullname') fullname: string,
  ): Promise<ResponseFromService> {
    const users = await this.userService.findByFullname(currentId, fullname);
    return {
      message: 'Users retreived successfully',
      data: users,
    }
  }
}
