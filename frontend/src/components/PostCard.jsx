import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, UserCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { CommentSection } from './CommentSection';
import api from '../api/axios';

const formatNumber = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
};

const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

export function PostCard({ post, index = 0, onDelete }) {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.user_liked || false);
    const [likeCount, setLikeCount] = useState(post.like_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentCount, setCommentCount] = useState(post.comment_count || 0);
    const [expanded, setExpanded] = useState(false);

    // Dropdown state
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuRef = useRef(null);

    // Đóng menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isAnonymous = post.is_anonymous;
    const author = post.author;
    const displayName = isAnonymous ? 'Ẩn danh' : (author?.display_name || author?.student_id || 'Người dùng');
    const isOwner = user?.id === post.author_id;

    const handleDeletePost = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa confession này không?')) return;
        setIsDeleting(true);
        try {
            await api.delete(`/posts/${post.id}`);
            if (onDelete) onDelete(post.id);
        } catch (err) {
            console.error('Lỗi khi xóa bài:', err);
            alert('Không thể xóa bài viết. Vui lòng thử lại sau.');
            setIsDeleting(false);
        }
    };

    const handleLike = async () => {
        try {
            if (liked) {
                await api.delete(`/posts/${post.id}/like`);
                setLikeCount((c) => c - 1);
            } else {
                await api.post(`/posts/${post.id}/like`);
                setLikeCount((c) => c + 1);
            }
            setLiked(!liked);
        } catch (err) {
            console.error('Like error:', err);
        }
    };

    const isLong = post.content?.length > 200;
    const displayContent = isLong && !expanded ? post.content.slice(0, 200) + '...' : post.content;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ y: -2, boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)' : '0 8px 30px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)' }}
            className="rounded-2xl overflow-hidden"
            style={{
                background: isDark ? '#1A1A24' : '#FFFFFF',
                boxShadow: isDark
                    ? '0 2px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)'
                    : '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                marginBottom: '12px',
                transition: 'box-shadow 0.3s ease',
            }}
        >
            {/* Header */}
            <div className="flex items-start justify-between px-3 sm:px-5 pt-4 sm:pt-5 pb-3">
                <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                        {isAnonymous ? (
                            <div
                                className="w-11 h-11 rounded-full flex items-center justify-center"
                                style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}
                            >
                                <UserCircle size={28} style={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                            </div>
                        ) : (
                            <div
                                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)',
                                    fontSize: '0.9rem',
                                }}
                            >
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                                style={{
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    color: isDark ? '#F1F5F9' : '#1A1A2E',
                                }}
                            >
                                {displayName}
                            </span>
                            {isAnonymous && (
                                <span
                                    className="px-1.5 py-0.5 rounded-lg text-xs"
                                    style={{ background: 'rgba(197, 48, 48, 0.1)', color: '#C53030', fontFamily: 'Inter, sans-serif' }}
                                >
                                    Ẩn danh
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span style={{ fontSize: '0.78rem', color: isDark ? '#475569' : '#94A3B8' }}>
                                {timeAgo(post.created_at)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="relative" ref={menuRef}>
                    {isOwner && (
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            style={{ color: isDark ? '#475569' : '#94A3B8', background: showMenu ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') }}
                        >
                            <MoreHorizontal size={17} />
                        </button>
                    )}

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                    {showMenu && isOwner && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -5 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg z-50 overflow-hidden"
                            style={{
                                background: isDark ? '#1E1E2D' : '#FFFFFF',
                                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
                            }}
                        >
                            <button
                                onClick={handleDeletePost}
                                disabled={isDeleting}
                                className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 cursor-pointer transition-colors hover:opacity-80 disabled:opacity-50"
                                style={{ color: '#FF6B6B' }}
                            >
                                <Trash2 size={16} />
                                {isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}
                            </button>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Content */}
            <div className="px-3 sm:px-5 pb-3">
                <p
                    style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.93rem',
                        lineHeight: 1.65,
                        color: isDark ? '#CBD5E1' : '#374151',
                        whiteSpace: 'pre-line',
                    }}
                >
                    {displayContent}
                </p>
                {isLong && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="cursor-pointer"
                        style={{ color: '#E53E3E', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                    >
                        {expanded ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                )}
            </div>

            {/* Media */}
            {post.media && post.media.length > 0 && (
                <div className="px-3 sm:px-5 pb-3">
                    <div className={`grid gap-1.5 ${post.media.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {post.media.map((m) =>
                            m.media_type === 'image' ? (
                                <img
                                    key={m.id}
                                    src={m.file_url}
                                    alt={m.file_name}
                                    className="rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity w-full"
                                    style={{ aspectRatio: post.media.length >= 2 ? '1/1' : '16/9', maxHeight: post.media.length === 1 ? '320px' : '200px' }}
                                />
                            ) : m.media_type === 'audio' ? (
                                <div key={m.id} className="w-full">
                                    <audio controls className="w-full" style={{ height: '36px' }}>
                                        <source src={m.file_url} type={m.mime_type} />
                                    </audio>
                                </div>
                            ) : null
                        )}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="mx-3 sm:mx-5" style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' }} />

            {/* Actions */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-3">
                <div className="flex items-center gap-1">
                    <motion.button
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={handleLike}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
                        style={{
                            color: liked ? '#FF6B6B' : isDark ? '#64748B' : '#94A3B8',
                            background: liked ? 'rgba(255, 107, 107, 0.1)' : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            transition: 'color 0.2s ease, background 0.2s ease',
                        }}
                    >
                        <Heart size={17} fill={liked ? '#FF6B6B' : 'none'} strokeWidth={liked ? 0 : 1.8} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.82rem' }}>
                            {formatNumber(likeCount)}
                        </span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
                        style={{
                            color: showComments ? '#C53030' : isDark ? '#64748B' : '#94A3B8',
                            background: showComments ? (isDark ? 'rgba(197, 48, 48, 0.15)' : 'rgba(197, 48, 48, 0.08)') : 'transparent',
                            transition: 'color 0.2s ease, background 0.2s ease',
                        }}
                    >
                        <MessageCircle size={17} strokeWidth={1.8} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.82rem' }}>
                            {formatNumber(commentCount)}
                        </span>
                    </motion.button>
                </div>
            </div>

            {/* Comments */}
            <CommentSection postId={post.id} isOpen={showComments} />
        </motion.div>
    );
}
