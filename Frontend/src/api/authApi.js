import axiosInstance from './axiosInstance';

export const login = (email, password) =>
  axiosInstance.post('/api/v1/auth/login', { email, password });

export const register = (data) =>
  axiosInstance.post('/api/v1/auth/register', data);

