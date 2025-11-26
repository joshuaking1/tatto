import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    // Handle axios errors
    if ('response' in error && typeof error.response === 'object' && error.response !== null) {
      const response = error.response as { data?: { message?: string } };
      if (response.data?.message) {
        return response.data.message;
      }
    }

    // Handle objects with message property
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}
