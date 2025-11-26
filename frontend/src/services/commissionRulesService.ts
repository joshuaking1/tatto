import apiClient from './apiClient';
import type { CommissionRule } from '@/types';

export interface CreateCommissionRuleDto {
  name: string;
  tiers: any[];
}

export interface UpdateCommissionRuleDto {
  name?: string;
  tiers?: any[];
}

export const getAllCommissionRules = async (): Promise<CommissionRule[]> => {
    const { data } = await apiClient.get('/commission-rules');
    return data;
};

export const getCommissionRuleById = async (id: string): Promise<CommissionRule> => {
    const { data } = await apiClient.get(`/commission-rules/${id}`);
    return data;
};

export const createCommissionRule = async (data: CreateCommissionRuleDto): Promise<CommissionRule> => {
    const { data: response } = await apiClient.post('/commission-rules', data);
    return response;
};

export const updateCommissionRule = async (id: string, data: UpdateCommissionRuleDto): Promise<CommissionRule> => {
    const { data: response } = await apiClient.patch(`/commission-rules/${id}`, data);
    return response;
};

export const deleteCommissionRule = async (id: string): Promise<void> => {
    await apiClient.delete(`/commission-rules/${id}`);
};
