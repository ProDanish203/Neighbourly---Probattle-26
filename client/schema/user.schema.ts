import { LoginProvider, UserRole, Gender } from '@/lib/enums';
import { z } from 'zod';
import { paginationSchema, type PaginationSchema } from './common.schema';

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  role: z.nativeEnum(UserRole),
  loginProvider: z.nativeEnum(LoginProvider),
  hasNotifications: z.boolean(),
  isEmailVerified: z.boolean(),
  lastLoginAt: z.date().nullable(),
  lastActiveAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const minimalUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.nativeEnum(UserRole),
  avatar: z.string().nullable(),
});

export type MinimalUserSchema = z.infer<typeof minimalUserSchema>;

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  longitude: z.number().nullable(),
  latitude: z.number().nullable(),
  age: z.number().nullable(),
  gender: z.nativeEnum(Gender).nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  postalCode: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;

export const completeUserSchema = userSchema.extend({
  userProfile: userProfileSchema.nullable(),
});

export type CompleteUserSchema = z.infer<typeof completeUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  age: z.number().int().min(1).max(120).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  bio: z.string().optional(),
  longitude: z.number().optional(),
  latitude: z.number().optional(),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

export const getAllUsersResponseSchema = z.object({
  users: z.array(userSchema),
  pagination: paginationSchema,
});

export type GetAllUsersResponseSchema = z.infer<typeof getAllUsersResponseSchema>;

export const completeUserProfileResponseSchema = z.object({
  user: completeUserSchema,
});

export type CompleteUserProfileResponseSchema = z.infer<typeof completeUserProfileResponseSchema>;
