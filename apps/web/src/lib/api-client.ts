import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthResponse, ApiResponse } from '@paperless/shared';

/**
 * API Client Configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Axios Instance
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor - Attach Access Token
 */
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor - Handle Token Refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data.data!;

        // Update stored token
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API Error Handler
 */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data;
    return apiError?.error || apiError?.message || 'An error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
};

/**
 * API Client Methods
 */
export const api = {
  /**
   * Authentication
   */
  auth: {
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      universityId: string;
      phone?: string;
    }) => apiClient.post<ApiResponse>('/auth/register', data),

    login: (email: string, password: string) =>
      apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),

    logout: (refreshToken: string) =>
      apiClient.post<ApiResponse>('/auth/logout', { refreshToken }),

    refreshToken: (refreshToken: string) =>
      apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
        refreshToken,
      }),

    getProfile: () => apiClient.get<ApiResponse>('/auth/me'),

    updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) =>
      apiClient.patch<ApiResponse>('/auth/profile', data),

    changePassword: (currentPassword: string, newPassword: string) =>
      apiClient.post<ApiResponse>('/auth/change-password', {
        currentPassword,
        newPassword,
      }),
  },
};
