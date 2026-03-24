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
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpPurpose, setOtpPurpose] = useState('');
    const [pendingData, setPendingData] = useState(null);
    const [otpCode, setOtpCode] = useState('');
    const [loading, setLoading] = useState(false);

    const sectionStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        boxShadow: isDark
            ? '0 2px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    };

    const handleSendOtp = async (purpose, data) => {
        try {
            setLoading(true);
            await api.post('/auth/otp/send', { 
                email: user.email, // Always send OTP to the CURRENT authenticated user's email for authorization
                purpose 
            });
            setOtpPurpose(purpose);
            setPendingData(data);
            setShowOtpModal(true);
            toast.info('Mã OTP đã được gửi đến email của bạn');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Lỗi gửi OTP'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndSave = async () => {
        try {
            setLoading(true);
            // 1. Verify OTP
            await api.post('/auth/otp/verify', { 
                email: user.email, 
                otp_code: otpCode, 
                purpose: otpPurpose 
            });
            
            // 2. Save Changes
            await api.put('/users/me', { ...pendingData, otp_code: otpCode });
            
            toast.success('Cập nhật thành công');
            setShowOtpModal(false);
            setOtpCode('');
            setPendingData(null);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Xác thực hoặc cập nhật thất bại'));
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
                Cài đặt tài khoản
            </motion.h1>

            <div className="flex flex-col gap-6">
                {/* Thông tin cá nhân & Bảo mật */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl p-6"
                    style={sectionStyle}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-lg font-bold" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Thông tin & Bảo mật</h2>
                    </div>

                    <form 
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const display_name = formData.get('display_name');
                            const email = formData.get('email');
                            const password = formData.get('password');
                            
                            const data = { display_name };
                            
                            // If email or password changed, we need OTP
                            if (email !== user.email || password) {
                                if (email !== user.email) data.email = email;
                                if (password) data.password = password;
                                
                                const purpose = email !== user.email ? 'change_email' : 'change_password';
                                handleSendOtp(purpose, data);
                            } else {
                                // Just simple display name update
                                try {
                                    setLoading(true);
                                    await api.put('/users/me', data);
                                    toast.success('Cập nhật tên hiển thị thành công');
                                } catch (err) {
                                    toast.error(getApiErrorMessage(err, 'Lỗi cập nhật'));
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        className="space-y-5"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Tên hiển thị</label>
                                <input 
                                    name="display_name"
                                    type="text"
                                    defaultValue={user?.display_name || ''}
                                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                    style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Email liên kết</label>
                                <input 
                                    name="email"
                                    type="email"
                                    defaultValue={user?.email || ''}
                                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                    style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Mật khẩu mới (Để trống nếu không đổi)</label>
                            <input 
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                                style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-red-500/25 cursor-pointer disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)' }}
                            >
                                {loading ? 'Đang xử lý...' : 'Lưu tất cả thay đổi'}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Tài khoản section (fixed structure) */}
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
                                // onClick={() => setShowPasswordModal(true)} // Removed old password modal trigger
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

            {/* OTP Modal */}
            <AnimatePresence>
                {showOtpModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowOtpModal(false)}
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
                                    <h3 className="font-bold text-lg" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Xác thực OTP</h3>
                                </div>
                                <button onClick={() => setShowOtpModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer">
                                    <X size={20} style={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                </button>
                            </div>

                            <div className="text-center mb-6">
                                <p style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                                    Vì lý do bảo mật, một mã OTP đã được gửi đến email <strong>{user.email}</strong> để xác nhận thay đổi quan trọng này.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <input 
                                    type="text"
                                    maxLength="6"
                                    placeholder="Nhập 6 số"
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl border text-center text-3xl font-bold tracking-[0.5em] outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                    style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                />

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowOtpModal(false)}
                                        className="flex-1 py-3 rounded-xl font-semibold transition-all cursor-pointer"
                                        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleVerifyAndSave}
                                        disabled={loading || otpCode.length !== 6}
                                        className="flex-1 py-3 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-blue-500/25 cursor-pointer disabled:opacity-50"
                                        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)' }}
                                    >
                                        {loading ? 'Đang xác thực...' : 'Xác thực & Lưu'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

