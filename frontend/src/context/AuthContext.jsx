import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem('token'));

    const isAuthenticated = !!token;

    const refreshUser = useCallback(async () => {
        if (!token) return;
        try {
            const res = await api.get('/users/me');
            localStorage.setItem('user', JSON.stringify(res.data));
            setUser(res.data);
        } catch (err) {
            console.error('Refresh user error:', err);
        }
    }, [token]);

    // Tự động refresh thông tin user khi mở app
    useEffect(() => {
        if (token) refreshUser();
    }, [token, refreshUser]);

    const login = async (studentId, password) => {
        const res = await api.post('/auth/login', {
            student_id: studentId,
            password: password,
        });
        const { access_token } = res.data;
        localStorage.setItem('token', access_token);
        setToken(access_token);

        // Lấy thông tin user sau khi login
        const userRes = await api.get('/users/me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        localStorage.setItem('user', JSON.stringify(userRes.data));
        setUser(userRes.data);
        return userRes.data;
    };

    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);