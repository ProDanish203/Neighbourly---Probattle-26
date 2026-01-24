import { CreateServiceCategory, UpdateServiceCategory } from '@/schema/service-category.schema';
import api from './middleware';
import { AxiosError } from 'axios';
import { QuerySchema } from '@/schema/common.schema';

export const createServiceCategory = async (payload: CreateServiceCategory) => {
  try {
    const { data } = await api.post('/service-category', payload, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to create service category',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to create service category',
      };
    }
    return { success: false, response: 'Failed to create service category' };
  }
};

export const updateServiceCategory = async (id: string, payload: UpdateServiceCategory) => {
  try {
    const { data } = await api.put(`/service-category/${id}`, payload, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to update service category',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to update service category',
      };
    }
    return { success: false, response: 'Failed to update service category' };
  }
};

export const deleteServiceCategory = async (id: string) => {
  try {
    const { data } = await api.delete(`/service-category/${id}`, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to delete service category',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to delete service category',
      };
    }
    return { success: false, response: 'Failed to delete service category' };
  }
};

export const getAllServiceCategories = async (params: QuerySchema) => {
  try {
    const { data } = await api.get('/service-category', { params, withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get all service categories',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get all service categories',
      };
    }
    return { success: false, response: 'Failed to get all service categories' };
  }
};

export const getParentServiceCategories = async (params: QuerySchema) => {
  try {
    const { data } = await api.get('/service-category/parents', { params, withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get parent service categories',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get parent service categories',
      };
    }
    return { success: false, response: 'Failed to get parent service categories' };
  }
};

export const getServiceCategoryByParent = async (parentId: string, params: QuerySchema) => {
  try {
    const { data } = await api.get(`/service-category/parent/${parentId}`, { params, withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.data,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to get service category by parent',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'Failed to get service category by parent',
      };
    }
    return { success: false, response: 'Failed to get service category by parent' };
  }
};
