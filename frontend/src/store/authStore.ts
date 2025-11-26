import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

type JwtPayload = {
  sub: string; // user id
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  branchId?: string;
  permissions?: string[] | null;
  exp?: number;
  iat?: number;
};

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  organizationId: string | null;
  branchId: string | null;
  permissions: string[] | null;
  login: (token: string) => void;
  logout: () => void;
  setUser: (user: Partial<AuthState>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      isAuthenticated: false,
      userId: null,
      email: null,
      firstName: null,
      lastName: null,
      role: null,
      organizationId: null,
      branchId: null,
      permissions: null,
      login: (token) => {
        const payload = jwtDecode<JwtPayload>(token);
        set({
          accessToken: token,
          isAuthenticated: true,
          userId: payload.sub,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          role: payload.role,
          organizationId: payload.organizationId,
          branchId: payload.branchId ?? null,
          permissions: payload.permissions ?? null,
        });
      },
      logout: () => {
        set({
          accessToken: null,
          isAuthenticated: false,
          userId: null,
          email: null,
          firstName: null,
          lastName: null,
          role: null,
          organizationId: null,
          branchId: null,
          permissions: null,
        });
      },
      setUser: (user) => {
        set((state) => ({
          ...state,
          ...user,
        }));
      },
    }),
    { name: 'auth-storage' }
  )
);