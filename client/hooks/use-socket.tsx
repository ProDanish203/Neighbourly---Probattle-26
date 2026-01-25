'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { MessageSchema } from '@/schema/chat.schema';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, content: string) => void;
  onNewMessage: (callback: (message: MessageSchema) => void) => void;
  offNewMessage: () => void;
}

export function useSocket(): UseSocketReturn {
  const { token } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messageCallbackRef = useRef<((message: MessageSchema) => void) | null>(null);

  useEffect(() => {
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const baseUrl = apiUrl.replace(/\/$/, '').replace(/\/api\/v1$/, '');

    const newSocket = io(`${baseUrl}/chat`, {
      auth: {
        token: token,
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('new-message', (message: MessageSchema) => {
      if (messageCallbackRef.current) {
        messageCallbackRef.current(message);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  const joinChat = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit('join-chat', { chatId });
    }
  };

  const leaveChat = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-chat', { chatId });
    }
  };

  const sendMessage = (chatId: string, content: string) => {
    if (socket && isConnected) {
      socket.emit('send-message', { chatId, content });
    }
  };

  const onNewMessage = (callback: (message: MessageSchema) => void) => {
    messageCallbackRef.current = callback;
  };

  const offNewMessage = () => {
    messageCallbackRef.current = null;
  };

  return {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    onNewMessage,
    offNewMessage,
  };
}
