import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  google: (credential: string) =>
    api.post('/auth/google', { credential }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Jobs
export const jobsApi = {
  list: () => api.get('/jobs'),
  get: (id: string) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  scrape: (url: string) => api.post('/jobs/scrape', { url }),
};

// Resume
export const resumeApi = {
  list: () => api.get('/resume'),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('resume', file);
    return api.post('/resume/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => api.delete(`/resume/${id}`),
  parse: (file: File) => {
    const fd = new FormData();
    fd.append('resume', file);
    return api.post('/resume/parse', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Analysis
export const analysisApi = {
  analyze: (resumeId: string, jobId: string) =>
    api.post('/analysis/analyze', { resumeId, jobId }),
  get: (id: string) => api.get(`/analysis/${id}`),
  improveCV: (id: string) => api.post(`/analysis/${id}/improve-cv`),
  downloadReport: (id: string) => api.get(`/analysis/${id}/download-report`, { responseType: 'blob' }),
};

// Interview
export const interviewApi = {
  start: (analysisId: string, questionCount = 7) =>
    api.post('/interview/start', { analysisId, questionCount }),
  get: (id: string) => api.get(`/interview/${id}`),
  answer: (id: string, answer: string) =>
    api.post(`/interview/${id}/answer`, { answer }),
  end: (id: string) => api.post(`/interview/${id}/end`),
};
