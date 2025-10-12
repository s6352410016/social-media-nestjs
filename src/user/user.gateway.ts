import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { User } from 'generated/prisma';
import { Server } from 'socket.io';

interface ServerToClientEvents {
  usersActive: (users: Omit<User, 'passwordHash'>[] ) => void;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
export class UserGateway {
  @WebSocketServer()
  private server: Server<any, ServerToClientEvents>;

  private users: Omit<User, 'passwordHash'>[] = [];

  @SubscribeMessage('connected')
  connected(
    @MessageBody()
    activeUser: Omit<User, 'passwordHash'>,
  ) {
    if(!(this.users.some((user) => user.id === activeUser.id))){
      this.users.push(activeUser);
    }

    this.server.emit("usersActive", this.users);
  }
}
