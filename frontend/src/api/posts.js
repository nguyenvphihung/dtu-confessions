import api from './axios';

export const getPosts = (skip = 0, limit = 20, search = '') => {
    let url = `/posts/?skip=${skip}&limit=${limit}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    return api.get(url);
}

export const getPost = (postId) => {
    return api.get(`/posts/${postId}`);
};

export const createPost = (data) => {
    return api.post('/posts/', data);
};

export const deletePost = (postId) => {
    return api.delete(`/posts/${postId}`);
};

export const likePost = (postId) => {
    return api.post(`/posts/${postId}/like`);
};

export const unlikePost = (postId) => {
    return api.delete(`/posts/${postId}/like`);
};