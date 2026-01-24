import {
  UpdateUserSchema,
  GetAllUsersResponseSchema,
  CompleteUserProfileResponseSchema,
  UserSchema,
} from '@/schema/user.schema';
import api from './middleware';
import { AxiosError } from 'axios';
import { QuerySchema } from '@/schema/common.schema';
import { UserRole } from '@/lib/enums';

export const getAllUsers = async (role: UserRole, params: QuerySchema) => {
  try {
    const { data } = await api.get(`/user/all/${role}`, { params, withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as GetAllUsersResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get all users',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get all users',
      };
    }
    return { success: false, response: 'Failed to get all users' };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data } = await api.get('/user/me', { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as UserSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get current user',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get current user',
      };
    }
    return { success: false, response: 'Failed to get current user' };
  }
};

export const updateUser = async (payload: UpdateUserSchema) => {
  try {
    const { data } = await api.put('/user/me', payload, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as UserSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to update user',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to update user',
      };
    }
    return { success: false, response: 'Failed to update user' };
  }
};

export const updateAvatar = async (avatar: File) => {
  try {
    const formData = new FormData();
    formData.append('avatar', avatar);

    const { data } = await api.put('/user/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.data as UserSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to update avatar',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to update avatar',
      };
    }
    return { success: false, response: 'Failed to update avatar' };
  }
};

export const getCompleteUserProfile = async (id: string) => {
  try {
    const { data } = await api.get(`/user/profile/${id}`, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as CompleteUserProfileResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get complete user profile',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get complete user profile',
      };
    }
    return { success: false, response: 'Failed to get complete user profile' };
  }
};
