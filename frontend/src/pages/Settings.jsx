import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';
import { Sun, Moon, Shield, Bell, Globe } from 'lucide-react';

export function Settings() {
    const { isDark, toggleTheme } = useTheme();
    const { user } = useAuth();

    const sectionStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        boxShadow: isDark
            ? '0 2px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
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
                            <button className="text-sm px-4 py-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
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
        </div>
    );
}
