import {
  CreateChatSchema,
  CreateChatResponseSchema,
  GetAllChatsResponseSchema,
  GetChatByIdResponseSchema,
  SendMessageSchema,
  SendMessageResponseSchema,
} from '@/schema/chat.schema';
import api from './middleware';
import { AxiosError } from 'axios';

export const getAllChats = async () => {
  try {
    const { data } = await api.get('/chat', { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as GetAllChatsResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get all chats',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get all chats',
      };
    }
    return { success: false, response: 'Failed to get all chats' };
  }
};

export const getChatById = async (id: string) => {
  try {
    const { data } = await api.get(`/chat/${id}`, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as GetChatByIdResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get chat by id',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get chat by id',
      };
    }
    return { success: false, response: 'Failed to get chat by id' };
  }
};

export const createChat = async (payload: CreateChatSchema) => {
  try {
    const { data } = await api.post('/chat', payload, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as CreateChatResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to create chat',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to create chat',
      };
    }
    return { success: false, response: 'Failed to create chat' };
  }
};

export const sendMessage = async (payload: SendMessageSchema) => {
  try {
    const { data } = await api.post('/chat/message', payload, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as SendMessageResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to send message',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to send message',
      };
    }
    return { success: false, response: 'Failed to send message' };
  }
};

export const deleteChat = async (id: string) => {
  try {
    const { data } = await api.delete(`/chat/${id}`, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to delete chat',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to delete chat',
      };
    }
    return { success: false, response: 'Failed to delete chat' };
  }
};
