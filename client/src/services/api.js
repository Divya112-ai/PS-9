import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request interceptor: inject JWT ───
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ps9_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 ───
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ps9_token');
      localStorage.removeItem('ps9_user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── API helpers ───
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const incidentAPI = {
  create: (data) => api.post('/incidents', data),
  list: (params) => api.get('/incidents', { params }),
  get: (id) => api.get(`/incidents/${id}`),
  assign: (id, resourceId) => api.post(`/incidents/${id}/assign`, { resourceId }),
  updateStatus: (id, status) => api.post(`/incidents/${id}/status`, { status }),
  merge: (id, sourceIncidentId) => api.post(`/incidents/${id}/merge`, { sourceIncidentId }),
  recommendations: (id) => api.get(`/incidents/${id}/recommendations`),
};

export const resourceAPI = {
  list: (params) => api.get('/resources', { params }),
  get: (id) => api.get(`/resources/${id}`),
  updateStatus: (id, status) => api.patch(`/resources/${id}/status`, { status }),
  seed: () => api.post('/resources/seed'),
};

export const alertAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  acknowledge: (id) => api.patch(`/alerts/${id}/acknowledge`),
};

export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  types: () => api.get('/analytics/types'),
  severity: () => api.get('/analytics/severity'),
  priority: () => api.get('/analytics/priority'),
  responseTime: (days = 7) => api.get('/analytics/response-time', { params: { days } }),
  resources: () => api.get('/analytics/resources'),
  hotspots: () => api.get('/analytics/hotspots'),
  events: (limit = 50) => api.get('/analytics/events', { params: { limit } }),
};

export const demoAPI = {
  reset: () => api.post('/demo/reset'),
  marketFire: () => api.post('/demo/market-fire'),
};


export default api;