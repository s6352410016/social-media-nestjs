import {
  Controller,
  Get,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AtAuthGuard } from 'src/auth/guards/at-auth.guard';
import { ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { ResponseFromService } from 'src/utils/types';

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
  async findNotifications(
    @Query('cursor', ParseUUIDPipe) cursor?: string,
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<ResponseFromService> {
    const notifies = await this.notificationService.findPagination(
      cursor,
      limit,
    );
    
    return {
      message: 'Notifications retreived successfully',
      data: notifies,
    }
  }
}
