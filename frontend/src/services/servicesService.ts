import apiClient from './apiClient';
import type { Service, ServiceCategory } from '@/types';

export interface CreateServiceDto {
  name: string;
  description?: string;
  duration: number;
  basePrice: number;
  isActive?: boolean;
  categoryId: string;
  artistIds?: string[];
}

export type UpdateServiceDto = Partial<CreateServiceDto>;

export interface CreateServiceCategoryDto {
  name: string;
}

export const getAllServices = async (): Promise<Service[]> => {
  const response = await apiClient.get('/services');
  return response.data;
};

export const getServiceById = async (id: string): Promise<Service> => {
  const response = await apiClient.get(`/services/${id}`);
  return response.data;
};

export const createService = async (data: CreateServiceDto): Promise<Service> => {
  const response = await apiClient.post('/services', data);
  return response.data;
};

export const updateService = async (id: string, data: UpdateServiceDto): Promise<Service> => {
  const response = await apiClient.patch(`/services/${id}`, data);
  return response.data;
};

export const deleteService = async (id: string): Promise<void> => {
  await apiClient.delete(`/services/${id}`);
};

export const getAllServiceCategories = async (): Promise<ServiceCategory[]> => {
  const response = await apiClient.get('/service-categories');
  return response.data;
};

export const createServiceCategory = async (data: CreateServiceCategoryDto): Promise<ServiceCategory> => {
  const response = await apiClient.post('/service-categories', data);
  return response.data;
};

export const deleteServiceCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/service-categories/${id}`);
};
