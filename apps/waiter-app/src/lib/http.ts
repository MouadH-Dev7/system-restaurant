import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/auth/store';
import type { AuthSession } from '@/auth/types';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '/api';
const REQUEST_TIMEOUT_MS = 12_000;

export const http = axios.create({
  baseURL,
  timeout: REQUEST_TIMEOUT_MS,
});

const refreshClient = axios.create({
  baseURL,
  timeout: REQUEST_TIMEOUT_MS,
});

let interceptorsReady = false;
let refreshPromise: Promise<string | null> | null = null;

function isAuthRequest(url?: string) {
  return (
    url?.includes('/auth/login') ||
    url?.includes('/auth/refresh') ||
    url?.includes('/auth/logout')
  );
}

async function refreshAccessToken() {
  const session = useAuthStore.getState().session;
  if (!session?.refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<AuthSession>('/auth/refresh', {
        refreshToken: session.refreshToken,
      })
      .then(({ data }) => {
        useAuthStore.getState().setSession(data);
        return data.accessToken;
      })
      .catch(() => {
        useAuthStore.getState().clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function setupHttpInterceptors() {
  if (interceptorsReady) {
    return;
  }

  interceptorsReady = true;

  http.interceptors.request.use((config) => {
    const token = useAuthStore.getState().session?.accessToken;
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  });

  http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const request = error.config as RetryableRequestConfig | undefined;
      const status = error.response?.status;

      if (!request || !status) {
        return Promise.reject(error);
      }

      if (status === 401 && !request._retry && !isAuthRequest(request.url)) {
        request._retry = true;
        const nextAccessToken = await refreshAccessToken();

        if (nextAccessToken) {
          request.headers.set('Authorization', `Bearer ${nextAccessToken}`);
          return http(request);
        }
      }

      if (status === 401 && !isAuthRequest(request.url)) {
        useAuthStore.getState().clearSession();
      }

      return Promise.reject(error);
    },
  );
}

setupHttpInterceptors();
