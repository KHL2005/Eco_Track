import axios from 'axios';
import { toast } from 'sonner';

const axiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Simple flags to prevent showing the same error toast multiple times in quick succession
let authErrorShown = false;
let forbiddenErrorShown = false;

// Request interceptor — attach JWT from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('ecotrack_auth');
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        // ignore JSON parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 + 403 errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const url = error.config ? (error.config.url || '') : '';

    if (status === 401) {
      // A 401 on login/register means wrong credentials — let the page handle it
      if (url.includes('/auth/')) {
        return Promise.reject(error);
      }

      // Any other 401 means the session expired — clear storage and go to home
      localStorage.removeItem('ecotrack_auth');
      if (!authErrorShown) {
        authErrorShown = true;
        toast.error('Session expired. Please sign in again.');
        setTimeout(function () { authErrorShown = false; }, 3500);
      }
      window.location.href = '/';
      return Promise.reject(error);
    }

    if (status === 403) {
      console.warn('403 Forbidden error on:', url);

      // These endpoints return 403 for role-based access — suppress the toast for them
      const shouldSuppress =
        url.includes('/auth/') ||
        url.includes('/me') ||
        url.includes('/profile') ||
        url.includes('/user/') ||
        url.includes('/users/') ||
        url.includes('/current-user') ||
        url.includes('/current_user') ||
        url.includes('/info') ||
        url.includes('/issues') ||
        url.includes('/emissions') ||
        url.includes('/projects') ||
        url.includes('/sensors') ||
        url.includes('/compliance') ||
        url.includes('/audits') ||
        url.includes('/industry-documents');

      if (!shouldSuppress) {
        if (!forbiddenErrorShown) {
          forbiddenErrorShown = true;
          toast.error('Access denied. Insufficient permissions.');
          setTimeout(function () { forbiddenErrorShown = false; }, 3500);
        }
      }
    }

    // 5xx and network errors are not toasted globally — each page component
    // shows its own error message via its own catch block.

    return Promise.reject(error);
  }
);

export default axiosInstance;
