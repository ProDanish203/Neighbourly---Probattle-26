'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getAllChats, createChat, deleteChat } from '@/API/chat.api';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/lib/enums';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createChatSchema, type CreateChatSchema } from '@/schema/chat.schema';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ChatSchema } from '@/schema/chat.schema';

export default function ChatsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isSeeker = user?.role === UserRole.SEEKER;
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateChatSchema>({
    resolver: zodResolver(createChatSchema),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const result = await getAllChats();
      if (!result.success) {
        throw new Error(typeof result.response === 'string' ? result.response : 'Failed to load chats');
      }
      return result.response;
    },
    enabled: !!user,
  });

  const { mutateAsync: createChatMutate, isPending: isCreating } = useMutation({
    mutationFn: createChat,
    onSuccess: (result) => {
      if (result.success && result.response.chat) {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        router.push(`/chats/${result.response.chat.id}`);
        toast.success('Chat created successfully');
        reset();
      }
    },
  });

  const { mutateAsync: deleteChatMutate, isPending: isDeleting } = useMutation({
    mutationFn: deleteChat,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        toast.success('Chat deleted successfully');
        setDeleteChatId(null);
      } else {
        toast.error(typeof result.response === 'string' ? result.response : 'Failed to delete chat');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete chat');
      setDeleteChatId(null);
    },
  });

  const handleDeleteChat = async (chatId: string) => {
    const result = await deleteChatMutate(chatId);
    if (!result.success) {
      toast.error(typeof result.response === 'string' ? result.response : 'Failed to delete chat');
    }
  };

  const onSubmit = async (data: CreateChatSchema) => {
    const result = await createChatMutate(data);
    if (!result.success) {
      toast.error(typeof result.response === 'string' ? result.response : 'Failed to create chat');
    }
  };

  const getOtherUser = (chat: ChatSchema) => {
    if (!user) return null;
    return chat.userId === user.id ? chat.provider : chat.user;
  };

  const getLastMessage = (chat: ChatSchema) => {
    if (!chat.messages || chat.messages.length === 0) return null;
    return chat.messages[chat.messages.length - 1];
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
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-destructive">Failed to load chats. Please try again.</p>
          <button onClick={() => window.location.reload()} className="text-primary hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const chats = data?.chats || [];

  return (
    <div className="container px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Chats</h1>
            <p className="text-muted-foreground">Manage your conversations with providers and seekers</p>
          </div>
          {isSeeker && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Create New Chat</DialogTitle>
                    <DialogDescription>
                      Enter the provider's email address to start a new conversation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="providerEmail">Provider Email</Label>
                      <Input
                        id="providerEmail"
                        type="email"
                        placeholder="provider@example.com"
                        {...register('providerEmail')}
                        aria-invalid={errors.providerEmail ? 'true' : 'false'}
                      />
                      {errors.providerEmail && (
                        <p className="text-sm text-destructive">{errors.providerEmail.message}</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Chat'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">No chats yet</p>
              <p className="text-sm text-muted-foreground">
                {isSeeker
                  ? 'Start a new conversation with a provider'
                  : 'You will see chats here when users start conversations with you'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {chats.map((chat: ChatSchema) => {
              const otherUser = getOtherUser(chat);
              const lastMessage = getLastMessage(chat);
              if (!otherUser) return null;

              return (
                <Card
                  key={chat.id}
                  className="hover:shadow-md transition-shadow relative group"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar
                        className="h-10 w-10 shrink-0 cursor-pointer"
                        onClick={() => router.push(`/chats/${chat.id}`)}
                      >
                        <AvatarImage src={otherUser.avatar || undefined} alt={otherUser.name} />
                        <AvatarFallback className="text-sm">
                          {otherUser.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="flex-1 min-w-0 space-y-1 cursor-pointer"
                        onClick={() => router.push(`/chats/${chat.id}`)}
                      >
                        <p className="font-semibold text-sm truncate">{otherUser.name}</p>
                        {lastMessage ? (
                          <>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {lastMessage.content}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No messages yet</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteChatId(chat.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={deleteChatId !== null} onOpenChange={(open) => !open && setDeleteChatId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Chat</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this chat? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteChatId(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteChatId && handleDeleteChat(deleteChatId)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
