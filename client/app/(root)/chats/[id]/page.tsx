'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatById, sendMessage } from '@/API/chat.api';
import { useAuthStore } from '@/store/auth.store';
import { useSocket } from '@/hooks/use-socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { MessageSchema } from '@/schema/chat.schema';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const chatId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState<MessageSchema[]>([]);

  const { isConnected, joinChat, leaveChat, onNewMessage, offNewMessage } = useSocket();

  const { data, isLoading, error } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const result = await getChatById(chatId);
      if (!result.success) {
        throw new Error(typeof result.response === 'string' ? result.response : 'Failed to load chat');
      }
      return result.response;
    },
    enabled: !!chatId && !!user,
  });

  const { mutateAsync: sendMessageMutate, isPending: isSending } = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send message');
    },
  });

  // Join chat room when socket is connected and chat is loaded
  useEffect(() => {
    if (isConnected && chatId) joinChat(chatId);
    return () => {
      if (chatId) leaveChat(chatId);
    };
  }, [isConnected, chatId, joinChat, leaveChat]);

  useEffect(() => {
    if (data?.chat) setMessages(data.chat.messages || []);
  }, [data]);

  useEffect(() => {
    const handleNewMessage = (message: MessageSchema) => {
      if (message.chatId === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }
    };

    onNewMessage(handleNewMessage);

    return () => {
      offNewMessage();
    };
  }, [chatId, onNewMessage, offNewMessage, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || isSending) return;

    try {
      await sendMessageMutate({
        chatId,
        content: messageContent.trim(),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!user) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !data?.chat) {
    return (
      <div className="container px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-destructive">Failed to load chat. Please try again.</p>
          <Button onClick={() => router.push('/chats')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chats
          </Button>
        </div>
      </div>
    );
  }

  const chat = data.chat;
  const otherUser = chat.userId === user.id ? chat.provider : chat.user;

  return (
    <div className="container px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/chats')} variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={undefined} alt={otherUser.name} />
              <AvatarFallback>{otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{otherUser.name}</h1>
              <p className="text-sm text-muted-foreground">{otherUser.email}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <Card className="flex flex-col h-[calc(100vh-250px)]">
          <CardHeader className="border-b">
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user.id;
                  return (
                    <div key={message.id} className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      {!isOwnMessage && (
                        <Avatar size="sm" className="h-8 w-8">
                          <AvatarImage src={message.sender.avatar || undefined} alt={message.sender.name} />
                          <AvatarFallback>{message.sender.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {isOwnMessage && (
                        <Avatar size="sm" className="h-8 w-8">
                          <AvatarImage src={undefined} alt={message.sender.name} />
                          <AvatarFallback>{message.sender.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button type="submit" disabled={!messageContent.trim() || isSending || !isConnected} size="icon">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
