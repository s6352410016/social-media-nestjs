import { Socket } from 'socket.io';

export function handleWsDisconnection(
  client: Socket,
  clients: Map<string, Socket>,
) {
  for (const [key, value] of clients) {
    if (value.id === client.id) {
      clients.delete(key);
    }
  }
}
