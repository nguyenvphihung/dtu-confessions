import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';
import { Shield, Users, AlertTriangle, Settings, LogOut, ArrowLeft, FileText, BarChart3 } from 'lucide-react';

export function AdminLayout() {
    const { logout } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    
    const menuItems = [
        { path: '/admin/reports', icon: BarChart3, label: 'Báo cáo' },
        { path: '/admin/users', icon: Users, label: 'Người dùng' },
        { path: '/admin/posts', icon: FileText, label: 'Bài viết' },
    ];

    return (
        <div className="min-h-screen flex" style={{ background: isDark ? '#13131A' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 flex flex-col hidden md:flex" style={{ 
                background: isDark ? '#1A1A24' : '#FFFFFF',
                borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
            }}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                            style={{ background: 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)' }}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>Admin Panel</h1>
                            <p style={{ fontSize: '0.75rem', color: isDark ? '#64748B' : '#94A3B8' }}>Hệ thống quản trị</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => !item.disabled && navigate(item.path)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    style={{
                                        background: isActive ? (isDark ? 'rgba(229, 62, 62, 0.15)' : 'rgba(229, 62, 62, 0.08)') : 'transparent',
                                        color: isActive ? '#E53E3E' : isDark ? '#94A3B8' : '#64748B',
                                    }}
                                >
                                    <Icon size={18} />
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: isActive ? 600 : 500, fontSize: '0.9rem' }}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-auto p-6 space-y-2">
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-colors"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                        <ArrowLeft size={18} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>Về trang chủ</span>
                    </button>
                    <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ color: '#E53E3E' }}
                    >
                        <LogOut size={18} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>Đăng xuất</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-4 sm:p-8 max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
