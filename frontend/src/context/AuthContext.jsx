import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isAuthenticated = !!user;

    const refreshUser = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (err) {
            // not authenticated or token expired
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Tự động refresh thông tin user khi mở app (cookies auth)
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    // `remember` controls whether token/user are persisted to localStorage (long-lived)
    // or to sessionStorage (cleared when browser/tab closes).
    const login = async (studentId, password, remember = false) => {
        const res = await api.post('/auth/login', {
            student_id: studentId,
            password: password,
            remember: remember,
        });
        sessionStorage.clear(); // Clear any stale cache before setting new user
        setUser(res.data);
        return res.data;
    };

    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // ignore
        }
        sessionStorage.clear(); // Clean up cross-user state leaks
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);