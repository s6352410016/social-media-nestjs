import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { User } from 'generated/prisma';
import { Server, Socket } from 'socket.io';

interface ServerToClientEvents {
  usersActive: (
    users: (Omit<User, 'passwordHash'> & { active: boolean })[],
  ) => void;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
export class UserGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server<any, ServerToClientEvents>;

  private users: (Omit<User, 'passwordHash'> & {
    socketClientId: string;
    active: boolean;
  })[] = [];

  @SubscribeMessage('connected')
  connected(
    @MessageBody()
    activeUser: Omit<User, 'passwordHash'>,
    @ConnectedSocket()
    client: Socket,
  ) {
    if (!this.users.some((user) => user.id === activeUser.id)) {
      const activeUserData: Omit<User, 'passwordHash'> & {
        socketClientId: string;
        active: boolean;
      } = {
        ...activeUser,
        socketClientId: client.id,
        active: true,
      };
      this.users.push(activeUserData);
    }

    const filterUsers = this.users.map(
      ({ socketClientId, ...others }) => others,
    );
    this.server.emit('usersActive', filterUsers);
  }  

  handleDisconnect(client: Socket<any, ServerToClientEvents>) { 
    let userIdToDelete = '';

    const updateUsers = this.users.map(({ socketClientId, ...others }) => {
      if (socketClientId === client.id) {
        userIdToDelete = others.id;
        return {
          ...others,
          socketClientId,
          active: false,
        };
      }

      return {
        ...others,
        socketClientId,
      };
    });

    this.users = updateUsers;

    const filterUsers = updateUsers.map(
      ({ socketClientId, ...others }) => others,
    );
    client.broadcast.emit('usersActive', filterUsers);

    const index = this.users.findIndex((user) => user.id === userIdToDelete);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
}
