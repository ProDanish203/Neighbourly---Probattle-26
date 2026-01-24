import { Prisma } from '@db';

export const serviceCategorySelect = {
  id: true,
  name: true,
  description: true,
  image: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceCategorySelect;

export type ServiceCategorySelect = Prisma.ServiceCategoryGetPayload<{
  select: typeof serviceCategorySelect;
}>;
