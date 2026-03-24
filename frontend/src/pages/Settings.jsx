import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Shield, Bell, Globe, X, Lock } from 'lucide-react';
import { useState } from 'react';
import api, { getApiErrorMessage } from '../api/axios';
import { toast } from 'react-toastify';

export function Settings() {
    const { isDark, toggleTheme } = useTheme();
    const { user } = useAuth();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [loading, setLoading] = useState(false);

    const sectionStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        boxShadow: isDark
            ? '0 2px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            return toast.error('Mật khẩu xác nhận không khớp');
        }
        setLoading(true);
        try {
            await api.post('/users/password', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            toast.success('Đổi mật khẩu thành công');
            setShowPasswordModal(false);
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Lỗi đổi mật khẩu'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20 lg:pb-8">
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl mb-6 font-bold"
                style={{ color: isDark ? '#F1F5F9' : '#1A1A2E', fontFamily: 'Poppins, sans-serif' }}
            >
                Cài đặt
            </motion.h1>

            <div className="flex flex-col gap-4">
                {/* Giao diện */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl p-5"
                    style={sectionStyle}
                >
                    <h2 className="text-sm font-semibold mb-4 text-gray-500 uppercase tracking-wider relative flex items-center gap-2">
                        Giao diện
                    </h2>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Chế độ tối</div>
                            <div className="text-sm" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Giảm độ sáng và giúp mắt dễ chịu hơn</div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="w-12 h-6 rounded-full relative transition-colors duration-200"
                            style={{ background: isDark ? '#E53E3E' : '#E2E8F0' }}
                        >
                            <div
                                className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-200"
                                style={{ transform: isDark ? 'translateX(26px)' : 'translateX(4px)' }}
                            />
                        </button>
                    </div>
                </motion.div>

                {/* Tài khoản */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl p-5"
                    style={sectionStyle}
                >
                    <h2 className="text-sm font-semibold mb-4 text-gray-500 uppercase tracking-wider relative flex items-center gap-2">
                        Tài khoản
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 py-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500">
                                <Shield size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Thay đổi mật khẩu</div>
                                <div className="text-sm" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Cập nhật mật khẩu bảo vệ tài khoản</div>
                            </div>
                            <button 
                                onClick={() => setShowPasswordModal(true)}
                                className="text-sm px-4 py-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" 
                                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                            >
                                Đổi
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 py-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-500">
                                <Bell size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Thông báo tin nhắn</div>
                                <div className="text-sm" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Bật âm thanh báo khi có tương tác</div>
                            </div>
                            <button
                                className="w-12 h-6 rounded-full relative transition-colors duration-200"
                                style={{ background: '#E53E3E' }}
                            >
                                <div
                                    className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-200"
                                    style={{ transform: 'translateX(26px)' }}
                                />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Khác */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl p-5"
                    style={sectionStyle}
                >
                    <h2 className="text-sm font-semibold mb-4 text-gray-500 uppercase tracking-wider relative flex items-center gap-2">
                        Tùy chọn khác
                    </h2>
                    
                    <div className="flex items-center gap-4 py-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500">
                            <Globe size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Ngôn ngữ hiển thị</div>
                            <div className="text-sm" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Tiếng Việt</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
                            style={{ background: isDark ? '#1A1A24' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        <Lock size={20} />
                                    </div>
                                    <h3 className="font-bold text-lg" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E', fontFamily: 'Poppins, sans-serif' }}>Đổi mật khẩu</h3>
                                </div>
                                <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer">
                                    <X size={20} style={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                </button>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Mật khẩu cũ</label>
                                    <input 
                                        type="password"
                                        required
                                        value={passwordData.old_password}
                                        onChange={e => setPasswordData({...passwordData, old_password: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                        style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Mật khẩu mới</label>
                                    <input 
                                        type="password"
                                        required
                                        value={passwordData.new_password}
                                        onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                        style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Xác nhận mật khẩu mới</label>
                                    <input 
                                        type="password"
                                        required
                                        value={passwordData.confirm_password}
                                        onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                        style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                    />
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 py-3 rounded-xl font-semibold transition-all cursor-pointer"
                                        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-red-500/25 cursor-pointer disabled:opacity-50"
                                        style={{ background: 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)' }}
                                    >
                                        {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

