import apiClient from './apiClient';
import type { 
  Attendance, 
  AttendanceStatus, 
  BreakType, 
  AttendanceSummary, 
  AttendanceByEmployee 
} from '@/types';

// Clock Operations
export const clockIn = async (data: { location?: string; notes?: string }): Promise<Attendance> => {
  const response = await apiClient.post('/attendance/clock-in', data);
  return response.data;
};

export const clockOut = async (): Promise<Attendance> => {
  const response = await apiClient.post('/attendance/clock-out');
  return response.data;
};

export const getCurrentAttendance = async (): Promise<Attendance | null> => {
  const response = await apiClient.get('/attendance/current');
  return response.data;
};

// Break Operations
export const startBreak = async (attendanceId: string, type: BreakType): Promise<any> => {
  const response = await apiClient.post(`/attendance/${attendanceId}/break/start`, { type });
  return response.data;
};

export const endBreak = async (attendanceId: string): Promise<any> => {
  const response = await apiClient.post(`/attendance/${attendanceId}/break/end`);
  return response.data;
};

// CRUD Operations
export interface GetAllAttendanceFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  branchId?: string;
  status?: AttendanceStatus;
}

export const getAllAttendance = async (filters?: GetAllAttendanceFilters): Promise<Attendance[]> => {
  const response = await apiClient.get('/attendance', { params: filters });
  return response.data;
};

export const getAttendanceById = async (id: string): Promise<Attendance> => {
  const response = await apiClient.get(`/attendance/${id}`);
  return response.data;
};

export const updateAttendance = async (id: string, data: Partial<Attendance>): Promise<Attendance> => {
  const response = await apiClient.patch(`/attendance/${id}`, data);
  return response.data;
};

export const deleteAttendance = async (id: string): Promise<void> => {
  await apiClient.delete(`/attendance/${id}`);
};

// Analytics
export interface AttendanceAnalyticsFilters {
  startDate: string;
  endDate: string;
  employeeId?: string;
  branchId?: string;
}

export const getAttendanceSummary = async (filters: AttendanceAnalyticsFilters): Promise<AttendanceSummary> => {
  const response = await apiClient.get('/attendance/analytics/summary', { params: filters });
  return response.data;
};

export const getAttendanceByEmployee = async (filters: AttendanceAnalyticsFilters): Promise<AttendanceByEmployee[]> => {
  const response = await apiClient.get('/attendance/analytics/by-employee', { params: filters });
  return response.data;
};
