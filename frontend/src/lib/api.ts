import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const getBaseApiUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
  if (configuredUrl) {
    if (/\/api\/v1$/i.test(configuredUrl)) return configuredUrl;
    if (/\/api$/i.test(configuredUrl)) return `${configuredUrl}/v1`;
    return `${configuredUrl}/api/v1`;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api/v1';
  }
  return 'https://orderkare-3.onrender.com/api/v1';
};

const api = axios.create({
  baseURL: getBaseApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
