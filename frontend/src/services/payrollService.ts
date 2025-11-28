import apiClient from './apiClient';
import type { Payroll, Payslip, User, Branch } from '@/types';

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

export const getPayslipById = async (payslipId: string): Promise<Payslip & { 
  employee: User; 
  payroll: Payroll & { branch: Branch } 
}> => {
    const { data } = await apiClient.get(`/payroll/payslips/${payslipId}`);
    return data;
};
