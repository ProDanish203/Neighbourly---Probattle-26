import { Prisma } from '@db';
import { minimalUserSelect } from 'src/user/queries';

export const chatSelect = {
  id: true,
  userId: true,
  providerId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: minimalUserSelect,
  },
  provider: {
    select: minimalUserSelect,
  },
  messages: {
    select: {
      id: true,
      chatId: true,
      senderId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      sender: {
        select: minimalUserSelect,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.ChatSelect;

export type ChatSelect = Prisma.ChatGetPayload<{
  select: typeof chatSelect;
}>;
