import axiosInstance from './axiosInstance';

const userApi = {
  createUser: (data) =>
    axiosInstance.post('/api/v1/users', data),

  getAllUsers: () =>
    axiosInstance.get('/api/v1/users'),

  getUsersByRole: (role) =>
    axiosInstance.get(`/api/v1/users/role/${role}`),

  updateUser: (id, data) =>
    axiosInstance.put(`/api/v1/users/${id}`, data),

  deleteUser: (id) =>
    axiosInstance.delete(`/api/v1/users/${id}`),
};

export default userApi;

