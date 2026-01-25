import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiProperty, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@db';
import { ApiResponse } from 'src/common/types';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateChatDto, SendMessageDto } from './dto/chat.dto';
import { CreateChatResponse, GetChatResponse, SendMessageResponse, GetAllChatsResponse } from './types';

@Controller('chat')
@ApiTags('Chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @ApiProperty({
    title: 'Get All Chats',
    description: 'Get all chats for the current user',
  })
  @Get()
  async getAllChats(@CurrentUser() user: User): Promise<ApiResponse<GetAllChatsResponse>> {
    return this.chatService.getAllChats(user);
  }

  @ApiProperty({
    title: 'Create Chat',
    description: 'Create a new chat with a provider',
    type: CreateChatDto,
  })
  @Post()
  async createChat(
    @CurrentUser() user: User,
    @Body() createChatDto: CreateChatDto,
  ): Promise<ApiResponse<CreateChatResponse>> {
    return this.chatService.createChat(user, createChatDto);
  }

  @ApiProperty({ title: 'Get Chat', description: 'Get chat details by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Chat ID' })
  @Get(':id')
  async getChat(@CurrentUser() user: User, @Param('id') id: string): Promise<ApiResponse<GetChatResponse>> {
    return this.chatService.getChat(id, user);
  }

  @ApiProperty({ title: 'Delete Chat', description: 'Delete a chat' })
  @ApiParam({ name: 'id', type: String, description: 'Chat ID' })
  @Delete(':id')
  async deleteChat(@CurrentUser() user: User, @Param('id') id: string): Promise<ApiResponse<void>> {
    return this.chatService.deleteChat(id, user);
  }

  @ApiProperty({
    title: 'Send Message',
    description: 'Send a message in a chat',
    type: SendMessageDto,
  })
  @Post('message')
  async sendMessage(
    @CurrentUser() user: User,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<ApiResponse<SendMessageResponse>> {
    const result = await this.chatService.sendMessage(user, sendMessageDto);

    // Broadcast message to all clients in the chat room via socket
    if (result.success && result.data?.message) {
      this.chatGateway.broadcastMessage(sendMessageDto.chatId, result.data.message);
    }

    return result;
  }
}
