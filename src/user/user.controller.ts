import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBody } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import { CommonResponse } from 'src/utils/swagger/CommonResponse';

@Controller('user')
export class UserController {
  constructor(private userService: UserService){}

  @Patch('reset-password/:id')
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(
    @Param('id') id: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<CommonResponse> {
    return this.userService.resetPassword(id, resetPasswordDto);
  }
}
