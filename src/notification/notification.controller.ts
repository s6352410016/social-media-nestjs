import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AtAuthGuard } from 'src/auth/guards/at-auth.guard';
import { ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CommonResponse } from 'src/utils/swagger/common-response';

@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @UseGuards(AtAuthGuard)
  @Get('finds')
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Notifications retreived successfully',
    type: CommonResponse,
  })
  findNotifications(
    @Query('cursor', ParseIntPipe) cursor?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return this.notificationService.findPagination(
      cursor,
      limit,
    );
  }
}
