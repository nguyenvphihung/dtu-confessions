import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedLocal = localStorage.getItem('user');
        const savedSession = sessionStorage.getItem('user');
        const saved = savedLocal || savedSession;
        return saved ? JSON.parse(saved) : null;
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    });

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

    // `remember` controls whether token/user are persisted to localStorage (long-lived)
    // or to sessionStorage (cleared when browser/tab closes).
    const login = async (studentId, password, remember = false) => {
        const res = await api.post('/auth/login', {
            student_id: studentId,
            password: password,
        });
        const { access_token } = res.data;
        if (remember) {
            localStorage.setItem('token', access_token);
        } else {
            sessionStorage.setItem('token', access_token);
        }
        setToken(access_token);

        // Lấy thông tin user sau khi login
        const userRes = await api.get('/users/me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        if (remember) {
            localStorage.setItem('user', JSON.stringify(userRes.data));
        } else {
            sessionStorage.setItem('user', JSON.stringify(userRes.data));
        }
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
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
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