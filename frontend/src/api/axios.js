import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
});
// Ensure cookies are sent; we no longer auto-inject Authorization from storage.
api.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

// Nếu nhận 401 từ endpoint KHÔNG phải auth → logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
            // If server rejects due to auth, redirect to login.
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;