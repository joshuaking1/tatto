import apiClient from './apiClient';
import type { Branch } from '@/types';

export interface CreateBranchDto {
  name: string;
  address?: string;
  phone?: string;
  isDefault?: boolean;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
  isDefault?: boolean;
}

export const getAllBranches = async (): Promise<Branch[]> => {
    const { data } = await apiClient.get('/branches');
    return data;
};

export const getBranchById = async (id: string): Promise<Branch> => {
    const { data } = await apiClient.get(`/branches/${id}`);
    return data;
};

export const createBranch = async (data: CreateBranchDto): Promise<Branch> => {
    const { data: response } = await apiClient.post('/branches', data);
    return response;
};

export const updateBranch = async (id: string, data: UpdateBranchDto): Promise<Branch> => {
    const { data: response } = await apiClient.patch(`/branches/${id}`, data);
    return response;
};

export const deleteBranch = async (id: string): Promise<void> => {
    await apiClient.delete(`/branches/${id}`);
};
