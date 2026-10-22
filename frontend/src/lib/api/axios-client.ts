import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500/api/v1';

// The API's versioned resources live below /api/v1. Keep the origin as the
// Axios base so both /api/v1/* and the existing unversioned /auth/* routes work.
export const API_BASE_URL = rawApiUrl.replace(/\/api\/v1\/?$/, '') || 'http://localhost:3500';

export const toApiAssetUrl = (asset?: string | null): string | undefined => {
  if (!asset) return undefined;
  if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(asset) || /^(?:data|blob):/i.test(asset)) {
    return asset;
  }

  return new URL(asset.replace(/^\/+/, ''), `${API_BASE_URL}/`).toString();
};

if (process.env.NODE_ENV === 'development') {
  console.log('[Dev-Config] API Base URL:', API_BASE_URL);
}

export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// Drop tokens from the previous localStorage-based client after switching to
// in-memory access tokens and the backend's HttpOnly refresh cookie.
if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('ec_access_token');
    window.localStorage.removeItem('ec_refresh_token');
  } catch {
    // The application can still use its cookie session if storage is unavailable.
  }
}

const isAuthEndpoint = (url?: string) => /(?:^|\/)auth(?:\/|$)/.test(url || '');

const redactSensitiveParams = (params: unknown) => {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return params;

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      /token|password|secret|authorization|cookie|credential|code/i.test(key) ? '[REDACTED]' : value,
    ])
  );
};

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _authToken?: string | null;
}

const notifySessionExpired = () => {
  setAccessToken(null);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-logout'));
  }
};

// A single refresh promise is shared by bootstrap and all concurrent 401s.
export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axiosClient
      .post<{ accessToken: string }>('/auth/refresh')
      .then(({ data }) => {
        if (typeof data.accessToken !== 'string' || data.accessToken.length === 0) {
          throw new Error('The refresh endpoint returned no access token.');
        }
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Dev-Request] ${config.method?.toUpperCase()} -> ${config.url}`,
        config.params ? { params: redactSensitiveParams(config.params) } : ''
      );
    }

    if (accessToken && !isAuthEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    (config as RetriableRequestConfig)._authToken = accessToken;
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Dev-Request-Error]', error instanceof Error ? error.message : 'Request setup failed.');
    }
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Dev-Response] ${response.config.method?.toUpperCase()} -> ${response.config.url} | Status: ${response.status}`
      );
    }
    return response;
  },
  async (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `[Dev-Response-Error] ${error.config?.method?.toUpperCase()} -> ${error.config?.url} | Status: ${error.response?.status || 'Network Error'} | Message: ${error.message}`
      );
    }

    if (!error.response) {
      if (error.code === 'ERR_INVALID_URL' || error.message?.includes('Invalid URL')) {
        error.message = `Invalid API URL (${rawApiUrl}). Please verify your environment configuration.`;
      } else {
        error.message = `Backend not running or API unavailable. Could not connect to API server at ${rawApiUrl}.`;
      }
    }

    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      // Another request may have refreshed while this 401 was in flight.
      if (accessToken && originalRequest._authToken !== accessToken) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return await axiosClient(originalRequest);
      }

      const token = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return await axiosClient(originalRequest);
    } catch (refreshError) {
      notifySessionExpired();
      return Promise.reject(refreshError);
    }
  }
);
