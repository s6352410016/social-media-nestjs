import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { NotificationType } from 'generated/prisma';
import { IsNotificationType } from 'src/utils/decorators/is-notification-type';

export class CreateNotificationDto {
  @IsNotificationType({ message: 'Invalid notification type' })
  type: NotificationType;

  @IsInt()
  @IsNotEmpty()
  senderId: number;

  @IsInt()
  @IsNotEmpty()
  receiverId: number;

  @IsInt()
  @IsNotEmpty()
  postId?: number;

  @IsInt()
  @IsNotEmpty()
  commentId?: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
