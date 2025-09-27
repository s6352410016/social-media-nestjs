import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Notification } from 'generated/prisma';
import { Server } from 'socket.io';

interface ServerToClientEvents {
  [event: `notification:${string}`]: (notifications: Notification) => void;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
export class NotificationGateway {
  @WebSocketServer()
  private server: Server<any, ServerToClientEvents>;

  sendNotifications(notifications: Notification | Notification[]) {
    if (Array.isArray(notifications)) {
      notifications.forEach((notification) => {
        this.server.emit(
          `notification:${notification.receiverId}`,
          notification,
        );
      });
    } else {
      this.server.emit(`notification:${notifications.receiverId}`, notifications);
    }
  }
}
