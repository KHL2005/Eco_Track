import axiosInstance from './axiosInstance';

export const getUsers = () => axiosInstance.get('/users');
export const getUserById = (id) => axiosInstance.get(`/users/${id}`);
export const getUsersByRole = (role) => axiosInstance.get(`/users/role/${role}`);
export const createUser = (data, callerRole) =>
  axiosInstance.post('/users', data, { headers: { 'X-User-Role': callerRole } });
export const updateUser = (id, data) => axiosInstance.put(`/users/${id}`, data);
export const deleteUser = (id) => axiosInstance.delete(`/users/${id}`);
export const changePassword = (data) => axiosInstance.put('/users/change-password', data);
export const updateOwnProfile = (data) => axiosInstance.put('/users/update-profile', data);
