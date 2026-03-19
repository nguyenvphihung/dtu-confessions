import api from './axios';

export const uploadMedia = (postId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/media/upload/${postId}`, formData);
};

export const uploadProfileImage = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload-profile', formData);
};