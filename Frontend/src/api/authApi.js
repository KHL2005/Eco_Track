import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export const loginApi = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerApi = (data) =>
  api.post('/auth/register', data);

export default api;

