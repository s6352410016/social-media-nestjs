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
import { ApiOkResponse, ApiQuery, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { ResponseFromService } from 'src/utils/types';

@UseGuards(AtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('finds')
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Notifications retreived successfully',
    type: CommonResponse,
  })
  async findNotifications(
    @Query('activeUserId', ParseUUIDPipe) activeUserId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ResponseFromService> {
    const notifies = await this.notificationService.findPagination(
      activeUserId,
      cursor,
      limit,
    );
    
    return {
      message: 'Notifications retreived successfully',
      data: notifies,
    }
  }
}
