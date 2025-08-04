import { NotificationType, Post } from 'generated/prisma';
import { NotificationService } from 'src/notification/notification.service';

export async function createNotification(
  notificationService: NotificationService,
  activeUserId: number,
  post: Post,
) {
  if (activeUserId !== post.userId) {
    return notificationService.create({
      type: NotificationType.SHARE,
      senderId: activeUserId,
      receiverId: post.userId,
      postId: post.id,
      message: 'Share your post',
    });
  }
}
