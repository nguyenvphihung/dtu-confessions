import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MessageSquareHeart, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Register() {
    const { isDark } = useTheme();
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ student_id: '', password: '', display_name: '', email: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(79, 142, 247, 0.05)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(79, 142, 247, 0.15)',
        color: isDark ? '#F1F5F9' : '#1A1A2E',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.9rem',
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: isDark ? '#0F0F13' : '#F0F2F8' }}>
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
                            fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.5rem',
                            background: 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Tham gia cộng đồng
                    </h1>
                    <p style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '1rem', marginTop: '8px' }}>
                        Nơi chia sẻ những câu chuyện chưa kể.
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
                            Mã sinh viên *
                        </label>
                        <input type="text" value={form.student_id} onChange={update('student_id')} placeholder="VD: 102240XXX" required className="w-full px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                    </div>

                    <div>
                        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.82rem', color: isDark ? '#94A3B8' : '#64748B', display: 'block', marginBottom: '6px' }}>
                            Mật khẩu *
                        </label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Tối thiểu 6 ký tự" required className="w-full px-4 py-3 rounded-xl outline-none pr-12" style={inputStyle} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.82rem', color: isDark ? '#94A3B8' : '#64748B', display: 'block', marginBottom: '6px' }}>
                            Tên hiển thị
                        </label>
                        <input type="text" value={form.display_name} onChange={update('display_name')} placeholder="Tên bạn muốn hiển thị" className="w-full px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                    </div>

                    <div>
                        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.82rem', color: isDark ? '#94A3B8' : '#64748B', display: 'block', marginBottom: '6px' }}>
                            Email
                        </label>
                        <input type="email" value={form.email} onChange={update('email')} placeholder="email@dtu.edu.vn" className="w-full px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(229, 62, 62, 0.5)' }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3 rounded-xl text-white mt-2 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)', boxShadow: '0 8px 25px rgba(229, 62, 62, 0.4)' }}
                    >
                        {loading ? (
                            <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Tạo tài khoản</span>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 text-center" style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.9rem' }}>
                    Đã có tài khoản?{' '}
                    <Link to="/login" style={{ color: '#E53E3E', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Đăng nhập</Link>
                </div>
            </motion.div>
        </div>
    );
}