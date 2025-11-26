import apiClient from './apiClient';
import type { User, CustomerDetail } from '@/types';

export interface CreateCustomerDto {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address?: string;
    allergies?: string;
    notes?: string;
}

export interface UpdateCustomerDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    allergies?: string;
    notes?: string;
}

export const getAllCustomers = async (): Promise<User[]> => {
    const { data } = await apiClient.get('/customers');
    return data;
};

export const getCustomerById = async (id: string): Promise<CustomerDetail> => {
    const { data } = await apiClient.get(`/customers/${id}`);
    return data;
};

export const createCustomer = async (customerData: CreateCustomerDto): Promise<User> => {
    const { data } = await apiClient.post('/customers', customerData);
    return data;
};

export const updateCustomer = async (id: string, customerData: UpdateCustomerDto): Promise<User> => {
    const { data } = await apiClient.patch(`/customers/${id}`, customerData);
    return data;
};

export const deleteCustomer = async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
};
