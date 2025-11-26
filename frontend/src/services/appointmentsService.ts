// src/services/appointmentsService.ts
import apiClient from "./apiClient";
import { z } from 'zod';
import type { Appointment, ArtistAvailability, Blockout, AvailableSlot } from '@/types';

// Schema for validation, but we keep dates as strings to match Appointment interface
const appointmentSchema = z.object({
    id: z.string(),
    startTime: z.string(), // Kept as string to match Appointment interface
    endTime: z.string(),   // Kept as string to match Appointment interface
    status: z.string(),
    artist: z.object({ firstName: z.string(), lastName: z.string() }),
    customer: z.object({ firstName: z.string(), lastName: z.string() }),
    service: z.object({ name: z.string() }),
});

const appointmentArraySchema = z.array(appointmentSchema);

export const getAppointments = async (accessToken: string, startDate: Date, endDate: Date): Promise<Appointment[]> => {
    const { data } = await apiClient.get('/appointments', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        },
    });
    // We use safeParse or just return data casted if we trust the backend, 
    // but zod is good for validation. 
    // However, since we want to return Appointment[], we need to ensure the schema matches.
    // The schema above is a subset of Appointment. 
    // To return full Appointment[], we might just return data as Appointment[].
    // But the comment asked to make return type explicit.

    // If we use zod parse, it strips unknown keys by default unless we use passthrough().
    // So let's use passthrough() to keep other Appointment fields.
    return appointmentArraySchema.element.passthrough().array().parse(data) as unknown as Appointment[];
};

// DTOs
export interface CreateAppointmentDto {
    artistId: string;
    customerUserId: string;
    serviceId: string;
    startTime: string; // ISO string
    notes?: string;
}

export interface UpdateAppointmentDto {
    artistId?: string;
    customerUserId?: string;
    serviceId?: string;
    startTime?: string;
    notes?: string;
    status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}

export interface FindSlotsDto {
    startDate: string;
    endDate: string;
    serviceId: string;
    artistId?: string;
}

export interface SetScheduleDto {
    artistId: string;
    schedule: Array<{
        dayOfWeek: number;
        startTime: number;
        endTime: number;
    }>;
}

export interface CreateBlockoutDto {
    artistId: string;
    startTime: string;
    endTime: string;
    reason?: string;
}

// Appointment Functions
export const createAppointment = async (data: CreateAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
};

export const updateAppointment = async (id: string, data: UpdateAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.patch(`/appointments/${id}`, data);
    return response.data;
};

export const getAppointmentById = async (id: string): Promise<Appointment> => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
};

export const getAppointmentsByCustomer = async (customerUserId: string): Promise<Appointment[]> => {
    const response = await apiClient.get(`/appointments/customer/${customerUserId}`);
    return response.data;
};

export const findAvailableSlots = async (data: FindSlotsDto): Promise<AvailableSlot[]> => {
    const response = await apiClient.post('/appointments/available-slots', data);
    return response.data;
};

// Artist Availability Functions
export const setArtistSchedule = async (data: SetScheduleDto): Promise<ArtistAvailability[]> => {
    const response = await apiClient.post('/artist-availability/schedule', data);
    return response.data;
};

export const getArtistSchedule = async (artistId: string): Promise<ArtistAvailability[]> => {
    const response = await apiClient.get(`/artist-availability/schedule/${artistId}`);
    return response.data;
};

export const createBlockout = async (data: CreateBlockoutDto): Promise<Blockout> => {
    const response = await apiClient.post('/artist-availability/blockout', data);
    return response.data;
};

export const getArtistBlockouts = async (artistId: string): Promise<Blockout[]> => {
    const response = await apiClient.get(`/artist-availability/blockout/${artistId}`);
    return response.data;
};

export const deleteBlockout = async (blockoutId: string): Promise<void> => {
    await apiClient.delete(`/artist-availability/blockout/${blockoutId}`);
};