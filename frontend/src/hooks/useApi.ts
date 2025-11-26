import { useMemo } from 'react';
import axios, { AxiosInstance } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

export function useApi(): AxiosInstance {
    const accessToken = useAuthStore((state) => state.accessToken);
    const logout = useAuthStore((state) => state.logout);

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: 'http://localhost:3333',
            withCredentials: false,
        });

        // Request interceptor to add auth token
        instance.interceptors.request.use(
            (config) => {
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor to handle 401 errors
        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
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

        return instance;
    }, [accessToken, logout]);

    return api;
}
