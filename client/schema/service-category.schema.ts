import { z } from 'zod';

const serviceCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

type ServiceCategory = z.infer<typeof serviceCategorySchema>;

const createServiceCategorySchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

type CreateServiceCategory = z.infer<typeof createServiceCategorySchema>;

const updateServiceCategorySchema = createServiceCategorySchema.partial();

type UpdateServiceCategory = z.infer<typeof updateServiceCategorySchema>;

export {
  serviceCategorySchema,
  type ServiceCategory,
  createServiceCategorySchema,
  type CreateServiceCategory,
  updateServiceCategorySchema,
  type UpdateServiceCategory,
};
