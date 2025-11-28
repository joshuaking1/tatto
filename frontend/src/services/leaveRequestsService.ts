import apiClient from './apiClient';
import type { LeaveRequest, LeaveType, LeaveStatus } from '@/types';

// CRUD Operations
export interface CreateLeaveRequestDto {
  startDate: string;
  endDate: string;
  type: LeaveType;
  reason: string;
  notes?: string;
}

export interface GetAllLeaveRequestsFilters {
  employeeId?: string;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
}

export const createLeaveRequest = async (data: CreateLeaveRequestDto): Promise<LeaveRequest> => {
  const response = await apiClient.post('/leave-requests', data);
  return response.data;
};

export const getAllLeaveRequests = async (filters?: GetAllLeaveRequestsFilters): Promise<LeaveRequest[]> => {
  const response = await apiClient.get('/leave-requests', { params: filters });
  return response.data;
};

export const getLeaveRequestById = async (id: string): Promise<LeaveRequest> => {
  const response = await apiClient.get(`/leave-requests/${id}`);
  return response.data;
};

export const updateLeaveRequest = async (id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
  const response = await apiClient.patch(`/leave-requests/${id}`, data);
  return response.data;
};

export const approveLeaveRequest = async (id: string): Promise<LeaveRequest> => {
  const response = await apiClient.patch(`/leave-requests/${id}/approve`);
  return response.data;
};

export const rejectLeaveRequest = async (id: string): Promise<LeaveRequest> => {
  const response = await apiClient.patch(`/leave-requests/${id}/reject`);
  return response.data;
};

export const deleteLeaveRequest = async (id: string): Promise<void> => {
  await apiClient.delete(`/leave-requests/${id}`);
};
