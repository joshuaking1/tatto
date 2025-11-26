// src/services/dashboardService.ts
import { z } from 'zod';
import apiClient from './apiClient';

// Zod schema for validating the KPI data from the backend
const kpiSchema = z.object({
    totalRevenue: z.number(),
    totalSales: z.number(),
    newCustomers: z.number(),
    upcomingAppointments: z.number(),
    period: z.string(),
});

export type KpiData = z.infer<typeof kpiSchema>;

export const getKpis = async (accessToken: string): Promise<KpiData> => {
    const { data } = await apiClient.get('/dashboard/kpis', {
        headers: {
            Authorization: `Bearer ${accessToken}`, // The crucial authentication header
        },
    });
    return kpiSchema.parse(data); // Validate and return the data
};

// Schema for Sales Over Time
const salesOverTimeSchema = z.array(z.object({
    date: z.string(),
    total: z.number(),
}));
export type SalesOverTimeData = z.infer<typeof salesOverTimeSchema>;

export const getSalesOverTime = async (accessToken: string): Promise<SalesOverTimeData> => {
    const { data } = await apiClient.get('/dashboard/sales-over-time', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return salesOverTimeSchema.parse(data);
};

// Schema for Top Artists
const topArtistsSchema = z.array(z.object({
    artistId: z.string(),
    _sum: z.object({ priceAtTimeOfSale: z.number() }),
}));
export type TopArtistsData = z.infer<typeof topArtistsSchema>;

export const getTopArtists = async (accessToken: string): Promise<TopArtistsData> => {
    const { data } = await apiClient.get('/dashboard/top-performing-artists', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return topArtistsSchema.parse(data);
};

// Schema for Top Services
const topServicesSchema = z.array(z.object({
    serviceId: z.string().nullable(),
    _sum: z.object({ quantity: z.number() }),
    serviceName: z.string().optional(),
}));
export type TopServicesData = z.infer<typeof topServicesSchema>;

export const getTopServices = async (accessToken: string): Promise<TopServicesData> => {
    const { data } = await apiClient.get('/dashboard/top-services', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return topServicesSchema.parse(data);
};