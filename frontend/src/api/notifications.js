import api from './axios';

export const getNotifications = (skip = 0, limit = 20) => {
    return api.get(`/notifications/?skip=${skip}&limit=${limit}`);
};

export const getUnreadCount = () => {
    return api.get('/notifications/unread-count');
};

export const markAsRead = (notificationId) => {
    return api.put(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = () => {
    return api.put('/notifications/read-all');
};
