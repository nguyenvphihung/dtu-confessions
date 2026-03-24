import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, UserCircle, Trash2, Share2, Lock, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { CommentSection } from './CommentSection';
import { CreatePostModal } from './CreatePostModal';
import ImageModal from './ImageModal';
import { VideoModal } from './VideoModal';
import { AutoPlayVideo } from './AutoPlayVideo';
import api, { getApiErrorMessage } from '../api/axios';
import { createReport } from '../api/reports';
import { ShareModal } from './ShareModal';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

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
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.user_liked || false);
    const [likeCount, setLikeCount] = useState(post.like_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentCount, setCommentCount] = useState(post.comment_count || 0);
    const [expanded, setExpanded] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalStartIndex, setModalStartIndex] = useState(0);
    const [activeVideo, setActiveVideo] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);

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
        const res = await Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa confession này không?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
        });
        if (!res.isConfirmed) return;
        setIsDeleting(true);
        try {
            await api.delete(`/posts/${post.id}`);
            if (onDelete) onDelete(post.id);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể xóa bài viết'));
            setIsDeleting(false);
        }
    };

    const handleLike = async () => {
        const prevLiked = liked;
        const prevCount = likeCount;
        setLiked(!liked);
        setLikeCount((c) => c + (liked ? -1 : 1));
        
        try {
            const res = await api.post(`/posts/${post.id}/like`);
            const data = res.data?.data;
            if (data) {
                if (data.status === 'liked') setLiked(true);
                else if (data.status === 'unliked') setLiked(false);
                if (typeof data.like_count === 'number') setLikeCount(data.like_count);
            }
        } catch (err) {
            setLiked(prevLiked);
            setLikeCount(prevCount);
            toast.error(getApiErrorMessage(err, 'Không thể tương tác bài viết'));
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
                <div 
                    className={`flex items-start gap-3 ${!isAnonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    onClick={() => {
                        if (!isAnonymous && post.author_id) {
                            navigate(`/profile/${post.author_id}`);
                        }
                    }}
                >
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
                            {post.is_private && (
                                <div className="flex items-center justify-center p-1 rounded-full" style={{ background: 'rgba(100, 116, 139, 0.1)', color: isDark ? '#94A3B8' : '#64748B' }} title="Chỉ mình tôi">
                                    <Lock size={12} strokeWidth={2} />
                                </div>
                            )}
                            {post.confession_number && (
                                <span
                                    className="px-1.5 py-0.5 rounded-lg text-xs font-bold"
                                    style={{ background: 'rgba(197, 48, 48, 0.1)', color: '#C53030', fontFamily: 'Inter, sans-serif' }}
                                >
                                    #DTU_CFS_{post.confession_number}
                                </span>
                            )}
                            {isOwner && post.status === 'pending' && (
                                <span className="px-1.5 py-0.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>
                                    ⏳ Chờ duyệt
                                </span>
                            )}
                            {isOwner && post.status === 'rejected' && (
                                <span className="px-1.5 py-0.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', fontFamily: 'Inter, sans-serif' }} title={post.rejected_reason || ''}>
                                    ❌ Bị từ chối
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
                    {(isOwner || user) && (
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
                    {showMenu && (
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
                            {isOwner && (
                                <button
                                    onClick={handleDeletePost}
                                    disabled={isDeleting}
                                    className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 cursor-pointer transition-colors hover:opacity-80 disabled:opacity-50"
                                    style={{ color: '#FF6B6B' }}
                                >
                                    <Trash2 size={16} />
                                    {isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}
                                </button>
                            )}
                            {!isOwner && user && (
                                <button
                                    onClick={async () => {
                                        setShowMenu(false);
                                        const { value: reason, isConfirmed } = await Swal.fire({
                                            title: 'Báo cáo vi phạm',
                                            input: 'select',
                                            inputOptions: {
                                                spam: 'Spam / Quảng cáo',
                                                violence: 'Bạo lực / Đe dọa',
                                                harassment: 'Quấy rối',
                                                sensitive: 'Nội dung nhạy cảm',
                                                misinformation: 'Thông tin sai lệch',
                                                other: 'Khác',
                                            },
                                            inputPlaceholder: 'Chọn lý do',
                                            showCancelButton: true,
                                            confirmButtonText: 'Gửi báo cáo',
                                            cancelButtonText: 'Hủy',
                                            confirmButtonColor: '#EF4444',
                                        });
                                        if (!isConfirmed || !reason) return;
                                        try {
                                            await createReport('post', post.id, reason);
                                            toast.success('Đã gửi báo cáo. Cảm ơn bạn!');
                                        } catch (err) {
                                            toast.error(getApiErrorMessage(err, 'Không thể gửi báo cáo'));
                                        }
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 cursor-pointer transition-colors hover:opacity-80"
                                    style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                                >
                                    <Flag size={16} />
                                    Báo cáo
                                </button>
                            )}
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

            {/* Shared Post Embedding */}
            {post.shared_post && (
                <div className="mx-3 sm:mx-5 mb-3 p-3 sm:p-4 rounded-xl border" style={{
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                             style={{ background: post.shared_post.is_anonymous ? (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0') : 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)' }}>
                            {post.shared_post.is_anonymous ? '🎭' : (post.shared_post.author?.display_name || post.shared_post.author?.student_id || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                            {post.shared_post.is_anonymous ? 'Ẩn danh' : (post.shared_post.author?.display_name || post.shared_post.author?.student_id || 'Người dùng')}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: isDark ? '#475569' : '#94A3B8' }}>
                            {timeAgo(post.shared_post.created_at)}
                        </span>
                    </div>
                    <p style={{
                        fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.5,
                        color: isDark ? '#CBD5E1' : '#374151', whiteSpace: 'pre-line'
                    }}>
                        {post.shared_post.content}
                    </p>
                    {post.shared_post.media && post.shared_post.media.length > 0 && (
                        <div className="mt-2 text-xs" style={{ color: '#E53E3E', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                            [Đính kèm {post.shared_post.media.length} media]
                        </div>
                    )}
                </div>
            )}

            {/* Media */}
            {post.media && post.media.length > 0 && (
                <div className="px-3 sm:px-5 pb-3">
                    <div className={`grid gap-1.5 ${post.media.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {post.media.map((m, idx) =>
                            m.media_type === 'image' ? (
                                <img
                                    key={m.id}
                                    src={m.file_url}
                                    alt={m.file_name}
                                    className="rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity w-full"
                                    loading="lazy"
                                    decoding="async"
                                    style={{ aspectRatio: post.media.length >= 2 ? '1/1' : '16/9', maxHeight: post.media.length === 1 ? '320px' : '200px' }}
                                    onClick={() => { setModalStartIndex(idx); setShowImageModal(true); }}
                                />
                            ) : m.media_type === 'audio' ? (
                                <div key={m.id} className="w-full">
                                    <audio controls className="w-full" style={{ height: '36px' }}>
                                        <source src={m.file_url} type={m.mime_type} />
                                    </audio>
                                </div>
                            ) : m.media_type === 'video' ? (
                                <AutoPlayVideo key={m.id} media={m} onOpen={setActiveVideo} />
                            ) : null
                        )}
                    </div>
                </div>
            )}

            {showImageModal && (
                <ImageModal images={post.media.filter(m => m.media_type === 'image')} postId={post.id} initialIndex={modalStartIndex} onClose={() => setShowImageModal(false)} />
            )}
            <VideoModal open={!!activeVideo} source={activeVideo} onClose={() => setActiveVideo(null)} />

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

                <motion.button
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
                    style={{
                        color: isDark ? '#64748B' : '#94A3B8',
                        background: 'transparent',
                        transition: 'color 0.2s ease, background 0.2s ease',
                    }}
                >
                    <Share2 size={17} strokeWidth={1.8} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.82rem' }}>
                        Chia sẻ
                    </span>
                </motion.button>
            </div>

            {/* Comments */}
            <CommentSection postId={post.id} isOpen={showComments} />
            <ShareModal open={showShareModal} onClose={() => setShowShareModal(false)} post={post} />
        </motion.div>
    );
}
