import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MessageSquareHeart, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Login() {
    const { isDark } = useTheme();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(studentId, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: isDark ? '#0F0F13' : '#F0F2F8' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className="w-full max-w-md rounded-2xl p-8"
                style={{
                    background: isDark ? '#1A1A24' : '#FFFFFF',
                    boxShadow: isDark
                        ? '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)'
                        : '0 8px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
            >
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring', damping: 18, stiffness: 300 }}
                    className="flex flex-col items-center mb-8"
                >
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)', boxShadow: '0 8px 25px rgba(197, 48, 48, 0.4)' }}
                    >
                        <MessageSquareHeart size={28} color="white" />
                    </div>
                    <h1
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 700,
                            fontSize: '1.5rem',
                            background: 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        DTU Confession
                    </h1>
                    <p style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.875rem', marginTop: '4px' }}>
                        Đăng nhập để chia sẻ confession
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="px-4 py-3 rounded-xl text-sm"
                            style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B' }}
                        >
                            {error}
                        </motion.div>
                    )}
                    </AnimatePresence>

                    <div>
                        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.82rem', color: isDark ? '#94A3B8' : '#64748B', display: 'block', marginBottom: '6px' }}>
                            Mã sinh viên
                        </label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            placeholder="Nhập mã sinh viên"
                            required
                            className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(197, 48, 48, 0.05)',
                                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(197, 48, 48, 0.15)',
                                color: isDark ? '#F1F5F9' : '#1A1A2E',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.9rem',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.82rem', color: isDark ? '#94A3B8' : '#64748B', display: 'block', marginBottom: '6px' }}>
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                required
                                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 pr-12"
                                style={{
                                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(197, 48, 48, 0.05)',
                                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(197, 48, 48, 0.15)',
                                    color: isDark ? '#F1F5F9' : '#1A1A2E',
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '0.9rem',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                                style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02, boxShadow: '0 6px 28px rgba(229, 62, 62, 0.5)' }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3 rounded-xl text-white mt-2 cursor-pointer disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)',
                            boxShadow: '0 4px 20px rgba(229, 62, 62, 0.4)',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                        }}
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </motion.button>
                </form>

                <div className="mt-6 text-center">
                    <div className="flex justify-between items-center">
                        <a href="#" style={{ color: '#E53E3E', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                            Quên mật khẩu?
                        </a>
                        <span style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.85rem' }}>
                            Chưa có tài khoản?{' '}
                            <Link
                                to="/register"
                                style={{ color: '#E53E3E', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                            >
                                Đăng ký ngay
                            </Link>
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}