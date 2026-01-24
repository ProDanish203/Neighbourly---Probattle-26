import {
  CreateServiceSchema,
  UpdateServiceSchema,
  GetNearbyServicesResponseSchema,
  GetServiceByIdResponseSchema,
  ServiceSchema,
  GetMyServicesResponseSchema,
} from '@/schema/service.schema';
import api from './middleware';
import { AxiosError } from 'axios';
import { ServiceQueryParamsSchema } from '@/schema/service.schema';
import { QuerySchema } from '@/schema/common.schema';

export const getNearbyServices = async (params: ServiceQueryParamsSchema) => {
  try {
    const { data } = await api.get('/service/nearby', { params, withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as GetNearbyServicesResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get nearby services',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get nearby services',
      };
    }
    return { success: false, response: 'Failed to get nearby services' };
  }
};

export const createService = async (payload: CreateServiceSchema, images: File[]) => {
  try {
    const formData = new FormData();

    // Append service data fields
    formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    formData.append('price', payload.price.toString());
    if (payload.duration) formData.append('duration', payload.duration.toString());
    formData.append('categoryId', payload.categoryId);
    formData.append('address', payload.address);

    // Append images
    images.forEach((image) => {
      formData.append('images', image);
    });

    const { data } = await api.post('/service', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.data as ServiceSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to create service',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to create service',
      };
    }
    return { success: false, response: 'Failed to create service' };
  }
};

export const updateService = async (id: string, payload: UpdateServiceSchema, images?: File[]) => {
  try {
    const formData = new FormData();

    // Append service data fields (only if they exist)
    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.description !== undefined) formData.append('description', payload.description);
    if (payload.price !== undefined) formData.append('price', payload.price.toString());
    if (payload.duration !== undefined) formData.append('duration', payload.duration.toString());
    if (payload.categoryId !== undefined) formData.append('categoryId', payload.categoryId);
    if (payload.address !== undefined) formData.append('address', payload.address);
    if (payload.isActive !== undefined) formData.append('isActive', payload.isActive.toString());

    // Append images if provided
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const { data } = await api.put(`/service/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.data as ServiceSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to update service',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to update service',
      };
    }
    return { success: false, response: 'Failed to update service' };
  }
};

export const deleteService = async (id: string) => {
  try {
    const { data } = await api.delete(`/service/${id}`, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to delete service',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to delete service',
      };
    }
    return { success: false, response: 'Failed to delete service' };
  }
};

export const getServiceById = async (id: string) => {
  try {
    const { data } = await api.get(`/service/${id}`, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as GetServiceByIdResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get service by id',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get service by id',
      };
    }
    return { success: false, response: 'Failed to get service by id' };
  }
};

export const getMyServices = async (params: QuerySchema) => {
  try {
    const { data } = await api.get('/service/my-services', { params, withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data as GetMyServicesResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get your services',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return { success: false, response: error.response?.data?.message || 'Failed to get your services' };
    }
    return { success: false, response: 'Failed to get your services' };
  }
};
