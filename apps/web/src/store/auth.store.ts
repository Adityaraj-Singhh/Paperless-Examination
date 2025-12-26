import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@paperless/shared';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  universityId: string;
  roles: UserRole[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateAccessToken: (accessToken: string) => void;
}

/**
 * Auth Store using Zustand
 * Persisted to localStorage
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        // Store tokens in localStorage for API client
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Clear tokens from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user) => set({ user }),

      updateAccessToken: (accessToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }
        set({ accessToken });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Auth Hooks
 */
export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) ?? false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some((role) => user?.roles.includes(role)) ?? false;
  };

  const hasAllRoles = (roles: UserRole[]): boolean => {
    return roles.every((role) => user?.roles.includes(role)) ?? false;
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };
};
