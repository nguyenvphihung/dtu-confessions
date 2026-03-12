import api from './axios';

export const register = (data) => {
    return api.post('/auth/register', data);
};

export const login = (data) => {
    return api.post('/auth/login', data);
};

export const getMe = () => {
    return api.get('/users/me');
};