import api from './axios';

export const getUsers = (skip = 0, limit = 20, search = '') => {
    let url = `/admin/users?skip=${skip}&limit=${limit}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    return api.get(url);
};

export const changeUserRole = (userId, role) => {
    return api.put(`/admin/users/${userId}/role`, { role });
};

export const toggleBanUser = (userId, isBanned) => {
    return api.put(`/admin/users/${userId}/ban?is_banned=${isBanned}`);
};

export const adminDeletePost = (postId) => {
    return api.delete(`/admin/posts/${postId}`);
};

export const adminDeleteComment = (commentId) => {
    return api.delete(`/admin/comments/${commentId}`);
};

// Moderation
export const getPendingPosts = (skip = 0, limit = 20) => {
    return api.get(`/admin/pending-posts?skip=${skip}&limit=${limit}`);
};

export const approvePost = (postId) => {
    return api.put(`/admin/posts/${postId}/approve`);
};

export const rejectPost = (postId, reason = '') => {
    return api.put(`/admin/posts/${postId}/reject`, { reason: reason || null });
};

// Reports
export const getReports = (skip = 0, limit = 20, status = '') => {
    let url = `/admin/reports?skip=${skip}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
};

export const resolveReport = (reportId, action) => {
    return api.put(`/admin/reports/${reportId}/resolve`, { action });
};