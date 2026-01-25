import { Chat, Message } from '@db';
import { MinimalUserSelect } from 'src/user/queries';

export interface ChatWithUsers extends Chat {
  user: MinimalUserSelect;
  provider: MinimalUserSelect;
  messages: Message[];
}

export interface MessageWithSender extends Message {
  sender: MinimalUserSelect;
}

export interface CreateChatResponse {
  chat: ChatWithUsers;
}

export interface GetChatResponse {
  chat: ChatWithUsers;
}

export interface SendMessageResponse {
  message: MessageWithSender;
}

export interface GetAllChatsResponse {
  chats: ChatWithUsers[];
}
