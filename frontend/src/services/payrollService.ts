import apiClient from './apiClient';
import type { Payroll } from '@/types';

export interface CreatePayrollDto {
  startDate: string;
  endDate: string;
  branchId: string;
  notes?: string;
}

export const generatePayroll = async (data: CreatePayrollDto): Promise<Payroll> => {
    const { data: response } = await apiClient.post('/payroll/generate', data);
    return response;
};

export const getAllPayrolls = async (): Promise<Payroll[]> => {
    const { data } = await apiClient.get('/payroll');
    return data;
};

export const getPayrollById = async (id: string): Promise<Payroll> => {
    const { data } = await apiClient.get(`/payroll/${id}`);
    return data;
};
