import { Prisma } from '@db';
import { minimalUserSelect } from 'src/user/queries';
import { serviceCategorySelect } from 'src/service-category/queries';

export const minimalServiceSelect = {
  id: true,
  name: true,
  description: true,
  images: true,
  price: true,
  duration: true,
  address: true,
  longitude: true,
  latitude: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceSelect;

export type MinimalServiceSelect = Prisma.ServiceGetPayload<{
  select: typeof minimalServiceSelect;
}>;

export const serviceSelect = {
  id: true,
  name: true,
  description: true,
  images: true,
  price: true,
  duration: true,
  address: true,
  longitude: true,
  latitude: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  provider: {
    select: minimalUserSelect,
  },
  category: {
    select: serviceCategorySelect,
  },
} satisfies Prisma.ServiceSelect;

export type ServiceSelect = Prisma.ServiceGetPayload<{
  select: typeof serviceSelect;
}>;
