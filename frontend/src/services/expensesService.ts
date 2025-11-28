import apiClient from './apiClient';
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types';

// DTOs
export interface CreateExpenseDto {
  amount: number;
  date: string | Date;
  description: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  branchId?: string;
  vendor?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface UpdateExpenseDto {
  amount?: number;
  date?: string | Date;
  description?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  branchId?: string;
  vendor?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface FilterExpensesDto {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  branchId?: string;
  vendor?: string;
  page?: number;
  limit?: number;
}

export interface CreateExpenseCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateExpenseCategoryDto {
  name?: string;
  description?: string;
}

// Expense API functions
export interface PaginatedExpenses {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
}

export const getAllExpenses = async (filters?: FilterExpensesDto): Promise<PaginatedExpenses> => {
  const response = await apiClient.get('/expenses', { params: filters });
  return response.data;
};

export const getExpenseById = async (id: string): Promise<Expense> => {
  const response = await apiClient.get(`/expenses/${id}`);
  return response.data;
};

export const createExpense = async (data: CreateExpenseDto): Promise<Expense> => {
  const response = await apiClient.post('/expenses', data);
  return response.data;
};

export const updateExpense = async (id: string, data: UpdateExpenseDto): Promise<Expense> => {
  const response = await apiClient.patch(`/expenses/${id}`, data);
  return response.data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await apiClient.delete(`/expenses/${id}`);
};

export const getTotalExpenses = async (filters?: FilterExpensesDto): Promise<{ total: number }> => {
  const response = await apiClient.get('/expenses/analytics/total', { params: filters });
  return response.data;
};

export const getExpensesByCategory = async (filters?: FilterExpensesDto): Promise<Array<{
  categoryId: string;
  categoryName: string;
  total: number;
}>> => {
  const response = await apiClient.get('/expenses/analytics/by-category', { params: filters });
  return response.data;
};

// ExpenseCategory API functions
export const getAllExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  const response = await apiClient.get('/expense-categories');
  return response.data;
};

export const getExpenseCategoryById = async (id: string): Promise<ExpenseCategory> => {
  const response = await apiClient.get(`/expense-categories/${id}`);
  return response.data;
};

export const createExpenseCategory = async (data: CreateExpenseCategoryDto): Promise<ExpenseCategory> => {
  const response = await apiClient.post('/expense-categories', data);
  return response.data;
};

export const updateExpenseCategory = async (id: string, data: UpdateExpenseCategoryDto): Promise<ExpenseCategory> => {
  const response = await apiClient.patch(`/expense-categories/${id}`, data);
  return response.data;
};

export const deleteExpenseCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/expense-categories/${id}`);
};
