import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Shield, Bell, Globe, X, Lock, User } from 'lucide-react';
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
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newData, setNewData] = useState({ email: '', password: '' });

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

    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Hồ sơ cá nhân', icon: <User size={18} /> },
        { id: 'security', label: 'Tài khoản & Bảo mật', icon: <Shield size={18} /> },
        { id: 'appearance', label: 'Giao diện & Hiển thị', icon: <Sun size={18} /> },
        { id: 'notifications', label: 'Thông báo', icon: <Bell size={18} /> }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold mb-1" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Hồ sơ cá nhân</h2>
                            <p className="text-sm" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Quản lý thông tin hiển thị với mọi người.</p>
                        </div>
                        <div className="p-6 rounded-2xl" style={sectionStyle}>
                            <form 
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    try {
                                        setLoading(true);
                                        await api.put('/users/me', { display_name: formData.get('display_name') });
                                        toast.success('Cập nhật hồ sơ thành công');
                                    } catch (err) {
                                        toast.error(getApiErrorMessage(err));
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                <div className="space-y-4">
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
                                    <div className="pt-2">
                                        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-red-500/25 cursor-pointer disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)' }}>
                                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                );
            case 'security':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold mb-1" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Tài khoản & Bảo mật</h2>
                            <p className="text-sm" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Quản lý email liên kết và mật khẩu đăng nhập.</p>
                        </div>
                        
                        <div className="p-6 rounded-2xl space-y-6" style={sectionStyle}>
                            {/* Email Section */}
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Email liên kết</h3>
                                <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', background: isDark ? '#0F172A' : '#F8FAFC' }}>
                                    <div>
                                        <div className="font-medium" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>{user?.email}</div>
                                        <div className="text-xs text-green-500 flex items-center gap-1 mt-1 font-medium"><Lock size={12}/> Đã xác minh</div>
                                    </div>
                                    <button 
                                        onClick={() => setShowEmailModal(true)}
                                        className="text-sm px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                                        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                    >
                                        Thay đổi
                                    </button>
                                </div>
                            </div>

                            <hr style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />

                            {/* Password Section */}
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Mật khẩu</h3>
                                <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', background: isDark ? '#0F172A' : '#F8FAFC' }}>
                                    <div>
                                        <div className="font-medium" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>••••••••</div>
                                        <div className="text-xs mt-1" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Đăng nhập an toàn bằng mật khẩu</div>
                                    </div>
                                    <button 
                                        onClick={() => setShowPasswordModal(true)}
                                        className="text-sm px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                                        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                    >
                                        Đổi mật khẩu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'appearance':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold mb-1" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Giao diện & Hiển thị</h2>
                            <p className="text-sm" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Tùy chỉnh trải nghiệm xem của bạn.</p>
                        </div>
                        <div className="p-6 rounded-2xl" style={sectionStyle}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        {isDark ? <Moon size={20} /> : <Sun size={20} />}
                                    </div>
                                    <div>
                                        <div className="font-medium" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Chế độ tối (Dark Mode)</div>
                                        <div className="text-sm" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Tối ưu giao diện cho môi trường thiếu sáng</div>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="w-14 h-7 rounded-full relative transition-colors duration-200 cursor-pointer"
                                    style={{ background: isDark ? '#E53E3E' : '#E2E8F0' }}
                                >
                                    <div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-200 shadow-sm" style={{ transform: isDark ? 'translateX(32px)' : 'translateX(4px)' }} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'notifications':
                 return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold mb-1" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Thông báo</h2>
                            <p className="text-sm" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Cài đặt nhận thông báo từ hệ thống.</p>
                        </div>
                        <div className="p-6 rounded-2xl" style={sectionStyle}>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <Bell size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Âm thanh thông báo</div>
                                        <div className="text-sm" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Phát âm thanh nhỏ khi có thông báo mới</div>
                                    </div>
                                </div>
                                <button className="w-14 h-7 rounded-full relative transition-colors duration-200 cursor-pointer" style={{ background: '#E53E3E' }}>
                                    <div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-200 shadow-sm" style={{ transform: 'translateX(32px)' }} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                 );
            default: return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 lg:pb-8 flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                 <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl mb-6 font-bold px-4 md:px-0"
                    style={{ color: isDark ? '#F1F5F9' : '#1A1A2E', fontFamily: 'Poppins, sans-serif' }}
                >
                    Cài đặt
                </motion.h1>
                <div className="overflow-x-auto flex md:flex-col gap-2 pb-2 md:pb-0 px-4 md:px-0 hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                            style={{ 
                                background: activeTab === tab.id ? (isDark ? '#2D3748' : '#FFFFFF') : 'transparent',
                                color: activeTab === tab.id ? (isDark ? '#F1F5F9' : '#E53E3E') : (isDark ? '#94A3B8' : '#64748B'),
                                border: activeTab === tab.id ? (isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)') : '1px solid transparent'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 px-4 md:px-0 min-w-0">
                {renderContent()}
            </div>

            {/* Email Change Modal */}
            <AnimatePresence>
                {showEmailModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEmailModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
                            style={{ background: isDark ? '#1A1A24' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}
                        >
                            <h3 className="text-xl font-bold mb-4" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Thay đổi Email</h3>
                            <div className="space-y-4">
                                <input 
                                    type="email" 
                                    placeholder="Nhập email mới" 
                                    className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-red-500/20"
                                    style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                    onChange={(e) => setNewData({ ...newData, email: e.target.value })}
                                />
                                <button 
                                    onClick={() => {
                                        if (newData.email && newData.email !== user.email) {
                                            handleSendOtp('change_email', { email: newData.email });
                                            setShowEmailModal(false);
                                        } else {
                                            toast.error("Email không hợp lệ hoặc trùng với email cũ");
                                        }
                                    }}
                                    className="w-full py-3 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-red-600 to-red-500 cursor-pointer"
                                >
                                    Tiếp tục xác thực
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Password Change Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPasswordModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
                            style={{ background: isDark ? '#1A1A24' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}
                        >
                            <h3 className="text-xl font-bold mb-4" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>Đổi mật khẩu</h3>
                            <div className="space-y-4">
                                <input 
                                    type="password" 
                                    placeholder="Mật khẩu mới (ít nhất 6 ký tự)" 
                                    className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-red-500/20"
                                    style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}
                                    onChange={(e) => setNewData({ ...newData, password: e.target.value })}
                                />
                                <button 
                                    onClick={() => {
                                        if (newData.password && newData.password.length >= 6) {
                                            handleSendOtp('change_password', { password: newData.password });
                                            setShowPasswordModal(false);
                                        } else {
                                            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
                                        }
                                    }}
                                    className="w-full py-3 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-red-600 to-red-500 cursor-pointer"
                                >
                                    Tiếp tục xác thực
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


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

