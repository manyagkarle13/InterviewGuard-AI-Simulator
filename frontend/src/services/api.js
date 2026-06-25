/**
 * API Service — Axios wrapper for all InterviewGuard AI Simulator backend calls.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const sessionAPI = {
  create: (data) => api.post('/sessions/', data),
  get: (id) => api.get(`/sessions/${id}/`),
  list: () => api.get('/sessions/list/'),
  complete: (id) => api.post(`/sessions/${id}/complete/`),
};

export const questionAPI = {
  generate: (sessionId) => api.post(`/sessions/${sessionId}/generate-question/`),
};

export const answerAPI = {
  evaluate: (sessionId, questionId, data) =>
    api.post(`/sessions/${sessionId}/questions/${questionId}/evaluate/`, data),
};

export const proctoringAPI = {
  logViolation: (sessionId, data) =>
    api.post(`/sessions/${sessionId}/proctoring-log/`, data),
};

export const reportAPI = {
  get: (sessionId) => api.get(`/sessions/${sessionId}/report/`),
};

export default api;
