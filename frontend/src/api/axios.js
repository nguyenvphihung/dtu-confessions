import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Tự động gắn JWT token vào mỗi request (nếu chưa có)
api.interceptors.request.use((config) => {
    if (!config.headers.Authorization) {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    // Nếu data là FormData → xóa Content-Type để browser tự set boundary
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

// Nếu nhận 401 từ endpoint KHÔNG phải auth → logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            !error.config.url.includes('/auth/')
        ) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;