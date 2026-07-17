import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  getProfile: () => api.get('/auth/profile'),
};

export const analyticsAPI = {
  getDashboardKPIs: () => api.get('/analytics/kpi'),
  getRevenueTrend: () => api.get('/analytics/revenue-trend'),
  getTopProducts: () => api.get('/analytics/top-products'),
  getPaymentDistribution: () => api.get('/analytics/payment-distribution'),
  getProfitMargins: () => api.get('/analytics/profit-margins'),
};

export const billingAPI = {
  createCheckoutSession: () => api.post('/billing/create-checkout-session'),
  createPortalSession: () => api.post('/billing/create-portal-session'),
  mockSuccess: () => api.post('/billing/mock-success'),
};

// Response interceptor: handle 401 (auto-logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('business');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
