import { z } from 'zod';
import { paginationSchema } from './common.schema';
import { minimalUserSchema } from './user.schema';
import { minimalServiceSchema } from './service.schema';
import { BookingStatus } from '@/lib/enums';

export const bookingSchema = z.object({
  id: z.string().uuid(),
  seekerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  providerId: z.string().uuid(),
  status: z.nativeEnum(BookingStatus),
  startDateTime: z.date(),
  endDateTime: z.date(),
  totalPrice: z.number(),
  address: z.string(),
  rating: z.number().nullable(),
  review: z.string().nullable(),
  cancelledReason: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  seeker: minimalUserSchema,
  provider: minimalUserSchema,
  service: minimalServiceSchema,
});

export type BookingSchema = z.infer<typeof bookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus, { message: 'Status is required' }),
});

export type UpdateBookingStatusSchema = z.infer<typeof updateBookingStatusSchema>;

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  providerId: z.string().uuid(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  address: z.string(),
});

export type CreateBookingSchema = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = z.object({
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  totalPrice: z.number().min(0).optional(),
  address: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  review: z.string().optional(),
  cancelledReason: z.string().optional(),
});

export type UpdateBookingSchema = z.infer<typeof updateBookingSchema>;

export const getAllBookingsResponseSchema = z.object({
  bookings: z.array(bookingSchema),
  pagination: paginationSchema,
});

export type GetAllBookingsResponseSchema = z.infer<typeof getAllBookingsResponseSchema>;

export const getBookingByIdResponseSchema = z.object({
  booking: bookingSchema,
});

export type GetBookingByIdResponseSchema = z.infer<typeof getBookingByIdResponseSchema>;
