import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8080';
  }
  return 'https://pos-system-hl6d.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const url = error.config?.url || '';
        const isAuthUrl =
          url.includes('/api/v1/auth/login') ||
          url.includes('/api/v1/auth/register') ||
          url.includes('/api/v1/auth/refresh');

        if (error.response?.status === 401 && !isAuthUrl) {
          // Attempt token refresh if a valid JWT refresh token is available
          const refreshToken = this.getRefreshToken();
          if (refreshToken && refreshToken.startsWith('eyJ')) {
            const refreshed = await this.handleTokenRefresh();
            if (refreshed && error.config) {
              return this.client.request(error.config);
            }
          }
          // Do NOT aggressively wipe session or force window.location.href = '/login'
          // Background requests can fail without breaking the user's active session.
        }
        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      return null;
    }
    return token;
  }

  private getRefreshToken(): string | null {
    const token = localStorage.getItem('refreshToken');
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      return null;
    }
    return token;
  }

  private setTokens(accessToken?: string, refreshToken?: string) {
    if (accessToken && accessToken !== 'undefined' && accessToken !== 'null') {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
    if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private async handleTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refreshToken,
      });

      const data = response.data?.data || response.data;
      const { accessToken, refreshToken: newRefreshToken } = data || {};
      if (accessToken && newRefreshToken) {
        this.setTokens(accessToken, newRefreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  handleLogout() {
    this.clearTokens();
    window.location.href = '/login';
  }

  // HTTP Methods
  async get<T>(url: string, config = {}) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config = {}) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config = {}) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config = {}) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config = {}) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Auth helpers
  setAuth(accessToken: string, refreshToken: string) {
    this.setTokens(accessToken, refreshToken);
  }

  clearAuth() {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const apiClient = new ApiClient();
