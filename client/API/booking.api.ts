import {
  UpdateBookingSchema,
  UpdateBookingStatusSchema,
  GetAllBookingsResponseSchema,
  GetBookingByIdResponseSchema,
  BookingSchema,
  CreateBookingSchema,
} from '@/schema/booking.schema';
import api from './middleware';
import { AxiosError } from 'axios';
import { QuerySchema } from '@/schema/common.schema';

export const getMyBookingsAsSeeker = async (params: QuerySchema) => {
  try {
    const { data } = await api.get('/booking/my-bookings/seeker', { params, withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as GetAllBookingsResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get my bookings as seeker',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get my bookings as seeker',
      };
    }
    return { success: false, response: 'Failed to get my bookings as seeker' };
  }
};

export const getMyBookingsAsProvider = async (params: QuerySchema) => {
  try {
    const { data } = await api.get('/booking/my-bookings/provider', { params, withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as GetAllBookingsResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get my bookings as provider',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get my bookings as provider',
      };
    }
    return { success: false, response: 'Failed to get my bookings as provider' };
  }
};

export const getBookingById = async (id: string) => {
  try {
    const { data } = await api.get(`/booking/${id}`, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as GetBookingByIdResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get booking by id',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get booking by id',
      };
    }
    return { success: false, response: 'Failed to get booking by id' };
  }
};

export const createBooking = async (payload: CreateBookingSchema) => {
  try {
    const { data } = await api.post('/booking', payload, { withCredentials: true });
    if (data?.success) {
      return { success: true, response: data.data as BookingSchema };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to create booking',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return { success: false, response: error.response?.data?.message || 'Failed to create booking' };
    }
    return { success: false, response: 'Failed to create booking' };
  }
};

export const updateBookingStatus = async (id: string, payload: UpdateBookingStatusSchema) => {
  try {
    const { data } = await api.put(`/booking/${id}/status`, payload, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to update booking status',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to update booking status',
      };
    }
    return { success: false, response: 'Failed to update booking status' };
  }
};

export const updateBooking = async (id: string, payload: UpdateBookingSchema) => {
  try {
    const { data } = await api.put(`/booking/${id}`, payload, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as BookingSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to update booking',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to update booking',
      };
    }
    return { success: false, response: 'Failed to update booking' };
  }
};
