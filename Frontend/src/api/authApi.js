import axiosInstance from './axiosInstance';

export const loginApi = (email, password) =>
  axiosInstance.post('/auth/login', { email, password });

export const registerApi = (data) =>
  axiosInstance.post('/auth/register', data);

export default axiosInstance;
