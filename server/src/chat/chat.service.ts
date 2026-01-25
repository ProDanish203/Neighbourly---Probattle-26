import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { AppLoggerService } from 'src/common/services/logger.service';
import { ApiResponse } from 'src/common/types';
import { throwError } from 'src/common/utils/helpers';
import { User } from '@db';
import { CreateChatDto, SendMessageDto } from './dto/chat.dto';
import { CreateChatResponse, GetChatResponse, SendMessageResponse, GetAllChatsResponse } from './types';
import { chatSelect, ChatSelect } from './queries';

@Injectable()
export class ChatService {
  private readonly logger = new AppLoggerService(ChatService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async getAllChats(user: User): Promise<ApiResponse<GetAllChatsResponse>> {
    try {
      const chats = await this.prismaService.chat.findMany({
        where: {
          OR: [{ userId: user.id }, { providerId: user.id }],
        },
        select: chatSelect,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return {
        message: 'Chats retrieved successfully',
        success: true,
        data: { chats },
      };
    } catch (err) {
      this.logger.error('Failed to get all chats', err.stack, ChatService.name);
      this.logger.logData({
        error: err.message,
        status: err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        method: 'getAllChats',
        userId: user.id,
      });
      throw throwError(err.message || 'Failed to get all chats', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createChat(user: User, createChatDto: CreateChatDto): Promise<ApiResponse<CreateChatResponse>> {
    try {
      const { providerEmail } = createChatDto;

      const provider = await this.prismaService.user.findUnique({
        where: { email: providerEmail },
        select: { id: true, role: true },
      });

      if (!provider) throw throwError('Provider not found', HttpStatus.NOT_FOUND);

      if (provider.role !== 'PROVIDER')
        throw throwError('The specified user is not a provider', HttpStatus.BAD_REQUEST);

      if (user.id === provider.id) throw throwError('You cannot create a chat with yourself', HttpStatus.BAD_REQUEST);

      const existingChat = await this.prismaService.chat.findFirst({
        where: {
          OR: [
            { userId: user.id, providerId: provider.id },
            { userId: provider.id, providerId: user.id },
          ],
        },
      });

      if (existingChat) {
        const chat = await this.prismaService.chat.findUnique({
          where: { id: existingChat.id },
          select: chatSelect,
        });
        if (!chat) throw throwError('Chat not found', HttpStatus.NOT_FOUND);

        return {
          message: 'Chat already exists',
          success: true,
          data: { chat },
        };
      }

      const chat = await this.prismaService.chat.create({
        data: {
          userId: user.id,
          providerId: provider.id,
        },
        select: chatSelect,
      });

      return {
        message: 'Chat created successfully',
        success: true,
        data: { chat },
      };
    } catch (err) {
      this.logger.error('Failed to create chat', err.stack, ChatService.name);
      this.logger.logData({
        error: err.message,
        status: err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        method: 'createChat',
        userId: user.id,
        chatData: createChatDto,
      });
      throw throwError(err.message || 'Failed to create chat', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChat(chatId: string, user: User): Promise<ApiResponse<GetChatResponse>> {
    try {
      const chat = await this.prismaService.chat.findUnique({
        where: { id: chatId },
        select: chatSelect,
      });

      if (!chat) throw throwError('Chat not found', HttpStatus.NOT_FOUND);

      if (chat.userId !== user.id && chat.providerId !== user.id) {
        throw throwError('You do not have permission to access this chat', HttpStatus.FORBIDDEN);
      }

      return {
        message: 'Chat retrieved successfully',
        success: true,
        data: { chat },
      };
    } catch (err) {
      this.logger.error('Failed to get chat', err.stack, ChatService.name);
      this.logger.logData({
        error: err.message,
        status: err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        method: 'getChat',
        userId: user.id,
        chatId,
      });
      throw throwError(err.message || 'Failed to get chat', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteChat(chatId: string, user: User): Promise<ApiResponse<void>> {
    try {
      const chat = await this.prismaService.chat.findUnique({
        where: { id: chatId },
        select: { id: true, userId: true, providerId: true },
      });

      if (!chat) throw throwError('Chat not found', HttpStatus.NOT_FOUND);

      if (chat.userId !== user.id && chat.providerId !== user.id) {
        throw throwError('You do not have permission to delete this chat', HttpStatus.FORBIDDEN);
      }

      await this.prismaService.chat.delete({
        where: { id: chatId },
      });

      return {
        message: 'Chat deleted successfully',
        success: true,
      };
    } catch (err) {
      this.logger.error('Failed to delete chat', err.stack, ChatService.name);
      this.logger.logData({
        error: err.message,
        status: err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        method: 'deleteChat',
        userId: user.id,
        chatId,
      });
      throw throwError(err.message || 'Failed to delete chat', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendMessage(user: User, sendMessageDto: SendMessageDto): Promise<ApiResponse<SendMessageResponse>> {
    try {
      const { chatId, content } = sendMessageDto;

      const chat = await this.prismaService.chat.findUnique({
        where: { id: chatId },
        select: { id: true, userId: true, providerId: true },
      });

      if (!chat) throw throwError('Chat not found', HttpStatus.NOT_FOUND);

      if (chat.userId !== user.id && chat.providerId !== user.id)
        throw throwError('You do not have permission to send messages in this chat', HttpStatus.FORBIDDEN);

      // Create message
      const message = await this.prismaService.message.create({
        data: {
          chatId,
          senderId: user.id,
          content: content.trim(),
        },
        select: {
          id: true,
          chatId: true,
          senderId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          sender: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              avatar: true,
            },
          },
        },
      });

      return {
        message: 'Message sent successfully',
        success: true,
        data: { message },
      };
    } catch (err) {
      this.logger.error('Failed to send message', err.stack, ChatService.name);
      this.logger.logData({
        error: err.message,
        status: err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        method: 'sendMessage',
        userId: user.id,
        messageData: sendMessageDto,
      });
      throw throwError(err.message || 'Failed to send message', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
