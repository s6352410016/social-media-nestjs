import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Provider, User } from 'generated/prisma';
import { Server } from 'socket.io';

interface ServerToClientEvents {
  usersActive: (users: (Omit<User, 'passwordHash'> & { provider: Provider })[] ) => void;
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

  private users: (Omit<User, 'passwordHash'> & { provider: Provider })[] = [];

  @SubscribeMessage('connected')
  connected(
    @MessageBody()
    activeUser: Omit<User, 'passwordHash'> & { provider: Provider },
  ) {
    if(!(this.users.some((user) => user.id === activeUser.id))){
      this.users.push(activeUser);
    }

    this.server.emit("usersActive", this.users);
  }
}
