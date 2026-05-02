import axiosInstance from './axiosInstance';

export const getNotifications = () => axiosInstance.get('/notifications');
export const getNotificationsByUser = (userId) => axiosInstance.get(`/notifications/user/${userId}`);
export const getUnreadByUser = (userId) => axiosInstance.get(`/notifications/user/${userId}/unread`);
export const markAsRead = (id) => axiosInstance.patch(`/notifications/${id}/read`);
export const markAsArchived = (id) => axiosInstance.patch(`/notifications/${id}/archive`);
export const markAllRead = (userId) => axiosInstance.patch(`/notifications/user/${userId}/read-all`);
export const deleteNotification = (id) => axiosInstance.delete(`/notifications/${id}`);
export const createNotification = (data) => axiosInstance.post('/notifications', data);

