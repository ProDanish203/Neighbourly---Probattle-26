import { z } from 'zod';
import { minimalUserSchema } from './user.schema';

export const messageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  sender: minimalUserSchema,
});

export type MessageSchema = z.infer<typeof messageSchema>;

export const chatSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  providerId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: minimalUserSchema,
  provider: minimalUserSchema,
  messages: z.array(messageSchema),
});

export type ChatSchema = z.infer<typeof chatSchema>;

export const createChatSchema = z.object({
  providerEmail: z.string().email({ message: 'Please enter a valid email address' }),
});

export type CreateChatSchema = z.infer<typeof createChatSchema>;

export const sendMessageSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().min(1, { message: 'Message cannot be empty' }),
});

export type SendMessageSchema = z.infer<typeof sendMessageSchema>;

export const getAllChatsResponseSchema = z.object({
  chats: z.array(chatSchema),
});

export type GetAllChatsResponseSchema = z.infer<typeof getAllChatsResponseSchema>;

export const getChatByIdResponseSchema = z.object({
  chat: chatSchema,
});

export type GetChatByIdResponseSchema = z.infer<typeof getChatByIdResponseSchema>;

export const createChatResponseSchema = z.object({
  chat: chatSchema,
});

export type CreateChatResponseSchema = z.infer<typeof createChatResponseSchema>;

export const sendMessageResponseSchema = z.object({
  message: messageSchema,
});

export type SendMessageResponseSchema = z.infer<typeof sendMessageResponseSchema>;
