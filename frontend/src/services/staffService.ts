import apiClient from './apiClient';
import type { User, StaffDetail } from '@/types';

export interface InviteStaffDto {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    branchId: string;
}

export interface UpdateStaffDto {
    firstName?: string;
    lastName?: string;
    role?: string;
    phone?: string;
    branchId?: string;
    bio?: string;
    instagramHandle?: string;
    commissionRate?: number;
    baseSalary?: number;
    salaryType?: string;
    commissionRuleId?: string;
}

export const getAllStaff = async (): Promise<User[]> => {
    const { data } = await apiClient.get('/staff');
    return data;
};

export const getStaffById = async (id: string): Promise<StaffDetail> => {
    const { data } = await apiClient.get(`/staff/${id}`);
    return data;
};

export const inviteStaff = async (staffData: InviteStaffDto): Promise<User> => {
    const { data } = await apiClient.post('/staff/invite', staffData);
    return data;
};

export const updateStaff = async (id: string, staffData: UpdateStaffDto): Promise<User> => {
    const { data } = await apiClient.patch(`/staff/${id}`, staffData);
    return data;
};

export const deleteStaff = async (id: string): Promise<void> => {
    await apiClient.delete(`/staff/${id}`);
};
