import { NotificationType } from 'generated/prisma';
import { CreateNotificationDto } from 'src/notification/dto/create-notification.dto';
import { NotificationService } from 'src/notification/notification.service';
import { PrismaService } from 'src/prisma/prisma.service';

export async function createNotifications(
  prismaService: PrismaService,
  notificationService: NotificationService,
  activeUserId: number,
  postId: number,
) {
  const users = await prismaService.user.findMany({
    select: {
      id: true,
    },
  });
  const notifications: CreateNotificationDto[] = users
    .filter((user) => user.id !== activeUserId)
    .map((user) => {
      return {
        type: NotificationType.POST,
        senderId: activeUserId,
        receiverId: user.id,
        postId,
        message: 'Create a new post',
      };
    });
  return notificationService.create(notifications);
}
