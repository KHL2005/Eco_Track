import axios from 'axios';
import { toast } from 'sonner';

const axiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// De-duplicate repeated alerts from concurrent/retried calls.
const recentErrorToasts = new Map();
const TOAST_DEDUPE_MS = 3500;

function toastErrorOnce(message, scope = 'global') {
  const key = `${scope}:${message}`;
  const now = Date.now();
  const last = recentErrorToasts.get(key) || 0;
  if (now - last < TOAST_DEDUPE_MS) return;
  recentErrorToasts.set(key, now);
  toast.error(message);

  // Keep map size bounded and auto-expire old keys.
  setTimeout(() => recentErrorToasts.delete(key), TOAST_DEDUPE_MS + 250);
}

// Request interceptor — attach JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('ecotrack_auth');
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch { /* ignore */ }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 + global errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';

      // A 401 on login/register means wrong credentials; keep page-local error handling.
      if (url.includes('/auth/')) {
        return Promise.reject(error);
      }

      // Any other 401 means session expired.
      localStorage.removeItem('ecotrack_auth');
      toastErrorOnce('Session expired. Please sign in again.', 'auth-401');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      const url = error.config?.url || '';
      // TEMP: Log all 403s for debugging
      // Remove or comment out after identifying the endpoint
      console.warn('403 Forbidden error on:', url);

      // List of endpoint patterns to exclude from showing the toast
      const excluded403Patterns = [
        /\/auth\//,
        /\/me$/,
        /\/profile$/,
        /\/user(s)?\//,
        /\/current[-_]user/,
        /\/info$/,
        /\/issues$/,
        /\/emissions$/,
        /\/projects$/,
        /\/sensors$/,
        /\/compliance$/,
        /\/audits$/,
        /\/industry-documents$/,
      ];
      const shouldSuppress = excluded403Patterns.some((pattern) => pattern.test(url));
      if (!shouldSuppress) {
        toastErrorOnce('Access denied. Insufficient permissions.', 'http-403');
      }
    } else if (error.response?.status >= 500) {
      toastErrorOnce('Server error. Please try again later.', 'http-5xx');
    } else if (!error.response) {
      toastErrorOnce('Network error. Check your connection and try again.', 'network');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
