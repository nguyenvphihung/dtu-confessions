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