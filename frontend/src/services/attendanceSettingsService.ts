import apiClient from './apiClient';
import type { AttendanceSettings } from '@/types';

export const getAttendanceSettings = async (): Promise<AttendanceSettings> => {
  const response = await apiClient.get('/attendance-settings');
  return response.data;
};

export const updateAttendanceSettings = async (data: Partial<AttendanceSettings>): Promise<AttendanceSettings> => {
  const response = await apiClient.put('/attendance-settings', data);
  return response.data;
};
