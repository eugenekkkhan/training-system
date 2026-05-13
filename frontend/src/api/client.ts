import axios from 'axios';
import type {
  User,
  Template,
  Log,
  Card,
  CardWithDisplay,
  SubmissionResult,
  DailyActivity,
  StatsOverview,
  LogStats,
  TemplateResult,
} from '../types';

export const api = axios.create({ baseURL: '/api' });

// Request interceptor: add Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401, clear token + redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const { data } = await api.post('/auth/register', { email, password });
    return data;
  },
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Templates API
export const templatesApi = {
  list: async (): Promise<Template[]> => {
    const { data } = await api.get('/templates');
    return data;
  },
  create: async (payload: {
    name: string;
    description: string;
    code: string;
    inputSchema: Record<string, any>;
    isGlobal?: boolean;
  }): Promise<Template> => {
    const { data } = await api.post('/templates', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Template>): Promise<Template> => {
    const { data } = await api.patch(`/templates/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },
  test: async (id: string, inputs: Record<string, any>): Promise<TemplateResult> => {
    const { data } = await api.post(`/templates/${id}/test`, { inputs });
    return data;
  },
};

// Logs API
export const logsApi = {
  list: async (): Promise<Log[]> => {
    const { data } = await api.get('/logs');
    return data;
  },
  create: async (payload: {
    name: string;
    description?: string;
    templateId?: string;
    isGlobal?: boolean;
  }): Promise<Log> => {
    const { data } = await api.post('/logs', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Log>): Promise<Log> => {
    const { data } = await api.patch(`/logs/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/logs/${id}`);
  },
  generateCards: async (id: string, count: number): Promise<Card[]> => {
    const { data } = await api.post(`/logs/${id}/generate`, { count });
    return data;
  },
};

// Cards API
export const cardsApi = {
  due: async (logId?: string): Promise<CardWithDisplay[]> => {
    const { data } = await api.get('/cards/due', { params: logId ? { logId } : undefined });
    return data;
  },
  forLog: async (logId: string): Promise<Card[]> => {
    const { data } = await api.get(`/logs/${logId}/cards`);
    return data;
  },
  createCard: async (logId: string, question: string, answer: string): Promise<Card> => {
    const { data } = await api.post(`/logs/${logId}/cards`, { question, answer });
    return data;
  },
  deleteCard: async (id: string): Promise<void> => {
    await api.delete(`/cards/${id}`);
  },
};

// Submissions API
export const submissionsApi = {
  submit: async (payload: {
    cardId: string;
    userAnswer: string;
    quality?: number;
  }): Promise<SubmissionResult> => {
    const { data } = await api.post('/submissions', payload);
    return data;
  },
};

// Stats API
export const statsApi = {
  heatmap: async (): Promise<DailyActivity[]> => {
    const { data } = await api.get('/stats/heatmap');
    return data;
  },
  overview: async (): Promise<StatsOverview> => {
    const { data } = await api.get('/stats/overview');
    return data;
  },
  logStats: async (logId: string): Promise<LogStats> => {
    const { data } = await api.get(`/stats/logs/${logId}`);
    return data;
  },
};

// Users API
export const usersApi = {
  getSettings: async (): Promise<User> => {
    const { data } = await api.get('/users/settings');
    return data;
  },
  updateSettings: async (payload: {
    dailyGoal?: number;
    notificationsEnabled?: boolean;
  }): Promise<User> => {
    const { data } = await api.patch('/users/settings', payload);
    return data;
  },
  savePushSubscription: async (subscription: PushSubscription): Promise<{ ok: boolean }> => {
    const { data } = await api.post('/users/push-subscription', { subscription });
    return data;
  },
  removePushSubscription: async (): Promise<void> => {
    await api.delete('/users/push-subscription');
  },
};

// Notifications API
export const notificationsApi = {
  getVapidPublicKey: async (): Promise<{ publicKey: string }> => {
    const { data } = await api.get('/notifications/vapid-public-key');
    return data;
  },
};
