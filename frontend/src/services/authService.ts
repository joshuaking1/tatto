// src/services/authService.ts
import { z } from 'zod';
import apiClient from './apiClient';

// We use Zod to define the shape of the data we expect from the API.
// This provides runtime validation and excellent TypeScript inference.
const loginSchema = z.object({
  access_token: z.string(),
});

// Define the type for our login credentials
export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
const loginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const login = async (credentials: LoginCredentials) => {
  const { data } = await apiClient.post('/auth/signin', credentials);
  return loginSchema.parse(data); // Validate the response from the server
};