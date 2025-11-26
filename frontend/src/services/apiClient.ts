// src/services/apiClient.ts
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

const apiClient = axios.create({
  baseURL: 'http://localhost:3333', // Our NestJS backend URL
  withCredentials: false,
});

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors and show toasts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      toast.error('Session expired. Please login again.');
      logout();
      window.location.href = '/login';
    } else if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      toast.error(message);
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;