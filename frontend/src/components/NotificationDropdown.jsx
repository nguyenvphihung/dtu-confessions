import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notifications';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, MessageCircle, Heart, CheckCircle, XCircle, ArrowUpRight, AlertTriangle } from 'lucide-react';

const NOTIFICATION_ICONS = {
    post_approved: { icon: CheckCircle, color: '#10B981' },
    post_rejected: { icon: XCircle, color: '#EF4444' },
    new_comment: { icon: MessageCircle, color: '#3B82F6' },
    new_reply: { icon: ArrowUpRight, color: '#8B5CF6' },
    new_like: { icon: Heart, color: '#EC4899' },
};

export function NotificationDropdown({ inRightbar = false }) {
    const { isDark } = useTheme();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await getUnreadCount();
            setUnreadCount(res.data.count || 0);
        } catch { /* ignore */ }
    }, [isAuthenticated]);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getNotifications(0, 20);
            setNotifications(res.data.items || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    // Poll unread count every 30s
    useEffect(() => {
        if (!isAuthenticated) return;
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchUnreadCount]);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handle = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const handleClickNotification = async (notification) => {
        if (!notification.is_read) {
            try {
                await markAsRead(notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch { /* ignore */ }
        }
        if (notification.ref_type === 'post' && notification.ref_id) {
            navigate(`/?search=${notification.ref_id}`);
        }
        setIsOpen(false);
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    };

    if (!isAuthenticated) return null;

    const formatTime = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Vừa xong';
        if (mins < 60) return `${mins} phút`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} giờ`;
        const days = Math.floor(hours / 24);
        return `${days} ngày`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl transition-all cursor-pointer"
                style={{
                    color: isOpen ? '#E53E3E' : isDark ? '#94A3B8' : '#64748B',
                    background: isOpen ? (isDark ? 'rgba(229, 62, 62, 0.15)' : 'rgba(229, 62, 62, 0.08)') : 'transparent',
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold"
                        style={{ background: 'linear-gradient(135deg, #C53030, #E53E3E)', boxShadow: '0 2px 6px rgba(229, 62, 62, 0.4)' }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: inRightbar ? 0 : 8, x: inRightbar ? 8 : 0, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                        exit={{ opacity: 0, y: inRightbar ? 0 : 8, x: inRightbar ? 8 : 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute ${inRightbar ? 'right-[calc(100%+12px)] top-0' : 'right-0 top-full mt-2'} w-80 sm:w-96 rounded-2xl overflow-hidden z-50`}
                        style={{
                            background: isDark ? '#1A1A24' : '#FFFFFF',
                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                            boxShadow: isDark
                                ? '0 20px 60px rgba(0,0,0,0.5)'
                                : '0 20px 60px rgba(0,0,0,0.12)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3" style={{
                            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                        }}>
                            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>Thông báo</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1 text-xs cursor-pointer"
                                    style={{ color: '#E53E3E', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                                >
                                    <CheckCheck size={14} /> Đọc tất cả
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C53030', borderTopColor: 'transparent' }} />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-10" style={{ color: isDark ? '#475569' : '#94A3B8' }}>
                                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Chưa có thông báo nào</p>
                                </div>
                            ) : (
                                notifications.map((n) => {
                                    const iconInfo = NOTIFICATION_ICONS[n.type] || { icon: Bell, color: '#64748B' };
                                    const Icon = iconInfo.icon;
                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => handleClickNotification(n)}
                                            className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors relative group"
                                            style={{
                                                background: n.is_read ? 'transparent' : isDark ? 'rgba(229, 62, 62, 0.04)' : 'rgba(229, 62, 62, 0.03)',
                                                borderBottom: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.03)',
                                            }}
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                                                style={{ background: `${iconInfo.color}15` }}>
                                                <Icon size={16} style={{ color: iconInfo.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-relaxed" style={{
                                                    fontFamily: 'Inter, sans-serif',
                                                    fontWeight: n.is_read ? 400 : 600,
                                                    color: isDark ? '#CBD5E1' : '#374151',
                                                }}>
                                                    {n.message}
                                                </p>
                                                <span className="text-xs mt-0.5 block" style={{ color: isDark ? '#475569' : '#94A3B8' }}>
                                                    {formatTime(n.created_at)}
                                                </span>
                                            </div>
                                            {!n.is_read && (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full mt-2" style={{ background: '#E53E3E' }} />
                                                    <button 
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                await markAsRead(n.id);
                                                                setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, is_read: true } : notif));
                                                                setUnreadCount(prev => Math.max(0, prev - 1));
                                                            } catch { /* ignore */ }
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                                                        title="Đánh dấu đã đọc"
                                                    >
                                                        <CheckCheck size={14} style={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
