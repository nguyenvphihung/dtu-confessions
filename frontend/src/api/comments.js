import api from './axios';

export const getComments = (postId) => {
    return api.get(`/posts/${postId}/comments`);
};

export const createComment = (postId, data) => {
    return api.post(`/posts/${postId}/comments/`, data);
};

export const deleteComment = (commentId) => {
    return api.delete(`/comments/${commentId}`);
};

export const likeComment = (commentId) => {
    return api.post(`/comments/${commentId}/like`);
};