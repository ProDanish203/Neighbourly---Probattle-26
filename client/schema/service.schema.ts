import { z } from 'zod';
import { paginationSchema } from './common.schema';
import { serviceCategorySchema } from './service-category.schema';
import { minimalUserSchema } from './user.schema';

export const serviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  images: z.array(z.string()),
  price: z.number(),
  duration: z.number().nullable(),
  address: z.string(),
  longitude: z.number().nullable(),
  latitude: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  provider: minimalUserSchema,
  category: serviceCategorySchema,
});

export type ServiceSchema = z.infer<typeof serviceSchema>;

export const minimalServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  images: z.array(z.string()),
  price: z.number(),
  duration: z.number().nullable(),
  address: z.string(),
  longitude: z.number().nullable(),
  latitude: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MinimalServiceSchema = z.infer<typeof minimalServiceSchema>;

export const createServiceSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  price: z.number({ message: 'Price is required' }).min(0, { message: 'Price must be at least 0' }),
  duration: z.number().int().min(1).optional(),
  categoryId: z.string().uuid({ message: 'Category ID is required' }),
  address: z.string({ message: 'Address is required' }).min(1, { message: 'Address is required' }),
});

export type CreateServiceSchema = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateServiceSchema = z.infer<typeof updateServiceSchema>;

export const serviceQueryParamsSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  sort: z.string().optional(),
  filter: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  price: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  radius: z.number().optional(),
});

export type ServiceQueryParamsSchema = z.infer<typeof serviceQueryParamsSchema>;

export const getNearbyServicesResponseSchema = z.object({
  services: z.array(serviceSchema),
  searchMetadata: z.object({
    userLocation: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    radiusKm: z.number(),
    algorithm: z.literal('Haversine'),
  }),
  pagination: paginationSchema,
});

export type GetNearbyServicesResponseSchema = z.infer<typeof getNearbyServicesResponseSchema>;

export const getServiceByIdResponseSchema = z.object({
  service: serviceSchema,
});

export type GetServiceByIdResponseSchema = z.infer<typeof getServiceByIdResponseSchema>;

export const getMyServicesResponseSchema = z.object({
  services: z.array(serviceSchema),
  pagination: paginationSchema,
});

export type GetMyServicesResponseSchema = z.infer<typeof getMyServicesResponseSchema>;
