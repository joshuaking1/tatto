// src/services/salesService.ts
// Sales service for POS functionality
import apiClient from './apiClient';
import { PaymentMethod } from '@/types';
import type { Sale } from '@/types';

export interface CreateSaleDto {
  customerUserId: string;
  appointmentId?: string;
  items: {
    type: 'SERVICE' | 'INVENTORY';
    itemId: string;
    quantity: number;
  }[];
  payments: {
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
  }[];
  discountAmount?: number;
  taxRate?: number;
  notes?: string;
}

export interface SaleItemInput {
  type: 'SERVICE' | 'INVENTORY';
  itemId: string;
  quantity: number;
  name: string;
  price: number;
}

export interface PaymentInput {
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
}

export const getAllSales = async (startDate?: string, endDate?: string): Promise<Sale[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await apiClient.get(`/sales?${params.toString()}`);
  return response.data;
};

export const getSaleById = async (id: string): Promise<Sale> => {
  const response = await apiClient.get(`/sales/${id}`);
  return response.data;
};

export const createSale = async (saleData: CreateSaleDto): Promise<Sale> => {
  const response = await apiClient.post('/sales', saleData);
  return response.data;
};
