import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/services/prisma.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import { minimalUserSelect } from 'src/user/queries';
import { User } from '@db';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = (await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      })) as any;

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.id },
        select: { id: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.join(`user:${user.id}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    // Cleanup if needed
  }

  @SubscribeMessage('join-chat')
  async handleJoinChat(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { chatId: string }) {
    if (!client.userId) return;

    const chat = await this.prismaService.chat.findUnique({
      where: { id: data.chatId },
      select: { id: true, userId: true, providerId: true },
    });

    if (!chat || (chat.userId !== client.userId && chat.providerId !== client.userId)) {
      return;
    }

    client.join(`chat:${data.chatId}`);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: SendMessageDto) {
    if (!client.userId) return;

    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: client.userId },
        select: minimalUserSelect,
      });

      if (!user) return;

      const result = await this.chatService.sendMessage(user as User, data);

      // Broadcast message to all clients in the chat room
      this.server.to(`chat:${data.chatId}`).emit('new-message', result.data?.message);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }

    const token = client.handshake.auth?.token;
    if (token) return token;

    return null;
  }
}
