import { useState, useEffect } from 'react';
import { TrendingUp, Search, Users, MessageSquare, FileText, Heart, Award, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import api from '../api/axios';
import { UserAvatar } from './UserAvatar';

export function RightPanel() {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [stats, setStats] = useState(null);
    const [topPosts, setTopPosts] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);

    useEffect(() => {
        setSearchTerm(searchParams.get('search') || '');
    }, [searchParams]);

    useEffect(() => {
        api.get('/stats/').then(r => setStats(r.data)).catch(() => {});
        api.get('/stats/top-posts').then(r => setTopPosts(r.data)).catch(() => {});
        api.get('/stats/active-users').then(r => setActiveUsers(r.data)).catch(() => {});
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (searchTerm.trim()) {
                navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
            } else {
                navigate('/');
            }
        }
    };

    const cardStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        boxShadow: isDark
            ? '0 2px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        borderRadius: '16px',
        marginBottom: '12px',
        overflow: 'hidden',
    };

    const statItems = stats ? [
        { icon: FileText, label: 'Bài confession', value: stats.total_posts, color: '#E53E3E' },
        { icon: Users, label: 'Thành viên', value: stats.total_users, color: '#3B82F6' },
        { icon: MessageSquare, label: 'Bình luận', value: stats.total_comments, color: '#8B5CF6' },
        { icon: Calendar, label: 'Hôm nay', value: stats.posts_today, color: '#22C55E' },
    ] : [];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col gap-0 w-full"
        >
            {/* Search */}
            <div style={cardStyle}>
                <div className="p-4">
                    <div
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(79, 142, 247, 0.06)',
                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(79, 142, 247, 0.12)',
                        }}
                    >
                        <Search size={16} style={{ color: isDark ? '#475569' : '#94A3B8', flexShrink: 0 }} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tìm kiếm confession..."
                            className="flex-1 bg-transparent outline-none"
                            style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.875rem',
                                color: isDark ? '#F1F5F9' : '#1A1A2E',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Community Stats */}
            {stats && (
                <div style={cardStyle}>
                    <div className="px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2 mb-3">
                            <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ background: 'rgba(229, 62, 62, 0.1)' }}
                            >
                                <TrendingUp size={13} style={{ color: '#E53E3E' }} />
                            </div>
                            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                                Thống kê cộng đồng
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {statItems.map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                    className="flex flex-col items-center py-3 rounded-xl"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <item.icon size={16} style={{ color: item.color, marginBottom: 6 }} />
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: item.color }}>
                                        {item.value.toLocaleString()}
                                    </span>
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', color: isDark ? '#475569' : '#94A3B8', marginTop: 2 }}>
                                        {item.label}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Top Posts */}
            {topPosts.length > 0 && (
                <div style={cardStyle}>
                    <div className="px-4 pt-4 pb-2">
                        <div className="flex items-center gap-2 mb-3">
                            <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                            >
                                <Heart size={13} style={{ color: '#EF4444' }} />
                            </div>
                            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                                Nổi bật tuần này
                            </span>
                        </div>
                        <div className="flex flex-col">
                            {topPosts.map((post, i) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                                    whileHover={{ x: 4, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                                    className="py-2.5 rounded-xl px-2 cursor-pointer"
                                    style={{
                                        borderBottom: i < topPosts.length - 1
                                            ? isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
                                            : 'none',
                                    }}
                                    onClick={() => {
                                        if (post.confession_number) {
                                            navigate(`/?search=${post.confession_number}`);
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex flex-col items-center">
                                            <span
                                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ 
                                                    background: i === 0 ? 'rgba(239, 68, 68, 0.1)' : isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', 
                                                    color: i === 0 ? '#EF4444' : isDark ? '#94A3B8' : '#64748B', 
                                                    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.75rem' 
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="line-clamp-2"
                                                style={{
                                                    fontFamily: 'Inter, sans-serif',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 500,
                                                    lineHeight: '1.45',
                                                    color: isDark ? '#E2E8F0' : '#1E293B',
                                                    marginBottom: '4px'
                                                }}
                                            >
                                                {post.content || "Bài viết không có nội dung..."}
                                            </div>
                                            <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500" style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.7rem' }}>
                                                <span className="flex items-center gap-1 font-medium" style={{ color: '#EF4444' }}>
                                                    <Heart size={10} fill="currentColor" /> {post.like_count}
                                                </span>
                                                <span className="opacity-50">•</span>
                                                <span className="flex items-center gap-1 font-medium">
                                                    {post.comment_count} bình luận
                                                </span>
                                                <span className="opacity-50">•</span>
                                                <span className="truncate max-w-[80px]" style={{ fontStyle: post.is_anonymous ? 'italic' : 'normal' }}>
                                                    {post.is_anonymous ? 'Ẩn danh' : (post.author?.display_name || post.author?.student_id)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Active Users */}
            {activeUsers.length > 0 && (
                <div style={cardStyle}>
                    <div className="px-4 pt-4 pb-2">
                        <div className="flex items-center gap-2 mb-3">
                            <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                            >
                                <Award size={13} style={{ color: '#3B82F6' }} />
                            </div>
                            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                                Thành viên tích cực
                            </span>
                        </div>
                        <div className="flex flex-col">
                            {activeUsers.map((u, i) => (
                                <motion.div
                                    key={u.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                                    whileHover={{ x: 4, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                                    className="flex items-center justify-between py-2.5 rounded-xl px-2 cursor-pointer"
                                    style={{
                                        borderBottom: i < activeUsers.length - 1
                                            ? isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
                                            : 'none',
                                    }}
                                    onClick={() => navigate(`/profile/${u.id}`)}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative">
                                            <UserAvatar 
                                                user={u} 
                                                sizeClasses="w-8 h-8" 
                                                fontSize="0.8rem" 
                                            />
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8rem', color: isDark ? '#CBD5E1' : '#374151' }}>
                                                {u.display_name || u.student_id}
                                            </div>
                                            <div style={{ fontSize: '0.68rem', color: isDark ? '#475569' : '#94A3B8' }}>
                                                {u.post_count} bài viết
                                            </div>
                                        </div>
                                    </div>
                                    {i < 3 && (
                                        <span style={{ fontSize: '1rem' }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                        </span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="px-2 py-2">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {['Giới thiệu', 'Quyền riêng tư', 'Điều khoản', 'Trợ giúp'].map((link) => (
                        <button key={link} className="cursor-pointer" style={{ fontSize: '0.7rem', color: isDark ? '#334155' : '#CBD5E1', fontFamily: 'Inter, sans-serif' }}>
                            {link}
                        </button>
                    ))}
                </div>
                <div className="mt-2" style={{ fontSize: '0.68rem', color: isDark ? '#1E293B' : '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
                    © 2026 DTU Confession
                </div>
            </div>
        </motion.div>
    );
}
