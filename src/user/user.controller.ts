import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CommonResponse } from 'src/utils/swagger/common-response';

@Controller('user')
export class UserController {
  constructor(private userService: UserService){}

  @Patch('reset-password/:userId')
  resetPassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<CommonResponse> {
    return this.userService.resetPassword(userId, resetPasswordDto);
  }
}
