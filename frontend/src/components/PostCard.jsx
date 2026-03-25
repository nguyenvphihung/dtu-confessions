import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, UserCircle, Trash2, Share2, Share, Lock, Globe, Flag, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { CommentSection } from './CommentSection';
import { CreatePostModal } from './CreatePostModal';
import { UserAvatar } from './UserAvatar';
import ImageModal from './ImageModal';
import { VideoModal } from './VideoModal';
import { AutoPlayVideo } from './AutoPlayVideo';
import api, { getApiErrorMessage } from '../api/axios';
import { createReport } from '../api/reports';
import { ShareModal } from './ShareModal';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const REACTION_TYPES = [
    { id: 'like', icon: '👍', color: '#1877F2', name: 'Thích' },
    { id: 'haha', icon: '😆', color: '#F7B125', name: 'Haha' },
    { id: 'wow', icon: '😲', color: '#F7B125', name: 'Wow' },
    { id: 'sad', icon: '😢', color: '#F7B125', name: 'Buồn' },
    { id: 'angry', icon: '😡', color: '#E4222E', name: 'Phẫn nộ' }
];

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

export const PostCard = React.memo(({ post, index = 0, onDelete, onUpdatePost }) => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [reaction, setReaction] = useState(post.user_reaction || null);
    const [likeCount, setLikeCount] = useState(post.like_count || 0);
    const [showReactions, setShowReactions] = useState(false);
    const reactionTimeout = useRef(null);
    const [showComments, setShowComments] = useState(false);

    const handleReactMouseEnter = () => {
        if (reactionTimeout.current) clearTimeout(reactionTimeout.current);
        setShowReactions(true);
    };

    const handleReactMouseLeave = () => {
        reactionTimeout.current = setTimeout(() => {
            setShowReactions(false);
        }, 300);
    };
    const [commentCount, setCommentCount] = useState(post.comment_count || 0);
    const [expanded, setExpanded] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalStartIndex, setModalStartIndex] = useState(0);
    const [modalImages, setModalImages] = useState([]);
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

    const handleReact = async (type) => {
        if (!user) {
            toast.info('Vui lòng đăng nhập để tương tác!');
            return;
        }

        const prevReaction = reaction;
        const prevCount = likeCount;

        let newReaction = type;
        let newCount = likeCount;

        if (prevReaction === type) {
            newReaction = null;
            newCount = Math.max(0, likeCount - 1);
        } else if (!prevReaction) {
            newCount = likeCount + 1;
        }

        setReaction(newReaction);
        setLikeCount(newCount);
        setShowReactions(false);
        if (onUpdatePost) {
            onUpdatePost(post.id, { user_reaction: newReaction, like_count: newCount });
        }

        try {
            const res = await api.post(`/posts/${post.id}/like?type=${type}`);
            const data = res.data?.data;
            if (data) {
                const finalReaction = data.status === 'unliked' ? null : (data.user_reaction || type);
                const finalCount = typeof data.like_count === 'number' ? data.like_count : newCount;
                
                setReaction(finalReaction);
                setLikeCount(finalCount);
                if (onUpdatePost) {
                    onUpdatePost(post.id, { user_reaction: finalReaction, like_count: finalCount });
                }
            }
        } catch (err) {
            setReaction(prevReaction);
            setLikeCount(prevCount);
            if (onUpdatePost) {
                onUpdatePost(post.id, { user_reaction: prevReaction, like_count: prevCount });
            }
            toast.error(getApiErrorMessage(err, 'Không thể bày tỏ cảm xúc'));
        }
    };

    const isLong = post.content?.length > 200;
    const displayContent = isLong && !expanded ? post.content.slice(0, 200) + '...' : post.content;

    const renderContentWithTags = (text) => {
        if (!text) return null;
        const parts = text.split(/([#@]\w+)/g);
        return parts.map((part, index) => {
            if (part.match(/^[#@]\w+/)) {
                return (
                    <span
                        key={index}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/?search=${encodeURIComponent(part.substring(1))}`);
                        }}
                        className="cursor-pointer hover:underline"
                        style={{ color: part.startsWith('#') ? '#E53E3E' : '#3182CE', fontWeight: 600 }}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

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
                    <UserAvatar 
                        user={post.author} 
                        isAnonymous={isAnonymous} 
                        sizeClasses="w-11 h-11"
                        fontSize="0.9rem"
                    />
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
                            {post.confession_number && (
                                <span
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigate(`/?search=${post.confession_number}`);
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[0.7rem] font-medium cursor-pointer transition-colors"
                                    style={{ 
                                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', 
                                        color: isDark ? '#CBD5E1' : '#475569', 
                                        fontFamily: 'Inter, sans-serif' 
                                    }}
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
                        <div className="flex items-center gap-1 mt-0.5">
                            <span style={{ fontSize: '0.78rem', color: isDark ? '#64748B' : '#94A3B8' }} className="hover:underline cursor-pointer">
                                {timeAgo(post.created_at)}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: isDark ? '#64748B' : '#94A3B8' }}>•</span>
                            <span className="flex items-center" style={{ color: isDark ? '#64748B' : '#94A3B8' }} title={post.is_private ? "Chỉ mình tôi" : "Công khai"}>
                                {post.is_private ? <Lock size={11} strokeWidth={2.5} /> : <Globe size={11} strokeWidth={2.5} />}
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
                    {renderContentWithTags(displayContent)}
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
                        <UserAvatar 
                            user={post.shared_post.author} 
                            isAnonymous={post.shared_post.is_anonymous} 
                            sizeClasses="w-7 h-7"
                            fontSize="0.75rem"
                        />
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
                        {renderContentWithTags(post.shared_post.content)}
                    </p>
                    {post.shared_post.media && post.shared_post.media.length > 0 && (
                        <div className="mt-3">
                            <div className={`grid gap-1.5 ${post.shared_post.media.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {post.shared_post.media.map((m, idx) =>
                                    m.media_type === 'image' ? (
                                        <img
                                            key={m.id}
                                            src={m.file_url}
                                            alt={m.file_name}
                                            className="rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity w-full"
                                            loading="lazy"
                                            decoding="async"
                                            style={{ aspectRatio: post.shared_post.media.length >= 2 ? '1/1' : '16/9', maxHeight: post.shared_post.media.length === 1 ? '240px' : '160px' }}
                                            onClick={() => { setModalImages(post.shared_post.media); setModalStartIndex(idx); setShowImageModal(true); }}
                                        />
                                    ) : m.media_type === 'audio' ? (
                                        <div key={m.id} className="w-full">
                                            <audio controls className="w-full" style={{ height: '32px' }}>
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
                                    onClick={() => { setModalImages(post.media); setModalStartIndex(idx); setShowImageModal(true); }}
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
                <ImageModal 
                    images={modalImages.filter(m => m.media_type === 'image')} 
                    postId={post.id} 
                    initialIndex={modalStartIndex} 
                    onClose={() => setShowImageModal(false)} 
                />
            )}
            <VideoModal open={!!activeVideo} source={activeVideo} onClose={() => setActiveVideo(null)} />

            {/* Stats Section */}
            {(likeCount > 0 || commentCount > 0 || post.share_count > 0) && (
                <div className="flex items-center justify-between px-3 sm:px-5 py-2.5">
                    <div className="flex items-center gap-2 cursor-pointer hover:underline text-[0.9rem]" style={{ color: isDark ? '#B0B3B8' : '#65676B' }}>
                        {likeCount > 0 ? (
                            <div className="flex items-center">
                                <div className="flex items-center -space-x-1 mr-2">
                                    {(() => {
                                        const displayReactions = [...new Set([...(post.top_reactions || []), reaction].filter(Boolean))].slice(0, 3);
                                        if (displayReactions.length === 0) displayReactions.push('like');
                                        return displayReactions.map((reactionId, index) => {
                                            const rInfo = REACTION_TYPES.find(r => r.id === reactionId);
                                            if (!rInfo) return null;
                                            const zIndex = 20 - index;
                                            if (rInfo.id === 'like') {
                                                return (
                                                    <div key={rInfo.id} className="w-[18px] h-[18px] rounded-full bg-[#1877F2] text-white flex items-center justify-center border-2 border-white dark:border-[#242526]" style={{ zIndex }}>
                                                        <ThumbsUp size={10} color="white" fill="white" strokeWidth={3} />
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={rInfo.id} className="w-[18px] h-[18px] rounded-full text-white flex items-center justify-center border-2 border-white dark:border-[#242526] overflow-hidden" 
                                                     style={{ zIndex, backgroundColor: rInfo.color || '#F7B125', '--tw-scale-x': '1.05', '--tw-scale-y': '1.05', transform: 'scale(var(--tw-scale-x))' }}>
                                                    <span className="text-[12px] leading-none transform translate-y-[-1px]">{rInfo.icon}</span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                                <span style={{ fontFamily: 'Inter, sans-serif' }}>{formatNumber(likeCount)}</span>
                            </div>
                        ) : <div />}
                    </div>
                    
                    <div className="flex items-center gap-3 text-[0.85rem]" style={{ color: isDark ? '#B0B3B8' : '#65676B', fontFamily: 'Inter, sans-serif' }}>
                        {commentCount > 0 && (
                            <div onClick={() => setShowComments(!showComments)} className="cursor-pointer hover:underline">
                                {formatNumber(commentCount)} bình luận
                            </div>
                        )}
                        {post.share_count > 0 && (
                            <div className="cursor-pointer hover:underline">
                                {formatNumber(post.share_count)} lượt chia sẻ
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="mx-3 sm:mx-4" style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginTop: (likeCount > 0 || commentCount > 0) ? 0 : '10px' }} />

            {/* Actions */}
            <div className="flex items-center justify-between px-2 sm:px-4 py-1.5">
                {/* Like Button Wrapper */}
                <div 
                    className="relative flex-1"
                    onMouseEnter={handleReactMouseEnter} 
                    onMouseLeave={handleReactMouseLeave}
                >
                    <AnimatePresence>
                        {showReactions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-1.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.15)] border z-50 origin-bottom-left"
                                style={{
                                    background: isDark ? '#242526' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                                }}
                            >
                                {REACTION_TYPES.map((r, i) => (
                                    <motion.button
                                        key={r.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        whileHover={{ scale: 1.3, originY: 1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => { e.stopPropagation(); handleReact(r.id); }}
                                        className="w-10 h-10 flex items-center justify-center text-[24px] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                                        title={r.name}
                                    >
                                        {r.id === 'like' ? (
                                            <div className="w-[32px] h-[32px] rounded-full bg-[#1877F2] flex items-center justify-center shadow-sm">
                                                <ThumbsUp size={16} color="white" fill="white" strokeWidth={3} />
                                            </div>
                                        ) : (
                                            r.icon
                                        )}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => handleReact(reaction || 'like')}
                        className="w-full flex items-center justify-center gap-2 py-[6px] rounded-md cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                            color: reaction ? REACTION_TYPES.find(r => r.id === reaction)?.color || '#1877F2' : isDark ? '#B0B3B8' : '#65676B',
                        }}
                    >
                        {reaction ? (
                            <span className="text-xl leading-none flex items-center justify-center" style={{ transform: 'translateY(-1px)' }}>
                                {reaction === 'like' ? (
                                    <div className="w-[22px] h-[22px] rounded-full bg-[#1877F2] flex items-center justify-center shadow-sm">
                                        <ThumbsUp size={12} color="white" fill="white" strokeWidth={3} />
                                    </div>
                                ) : (
                                    REACTION_TYPES.find(r => r.id === reaction)?.icon
                                )}
                            </span>
                        ) : (
                            <ThumbsUp size={20} strokeWidth={1.75} />
                        )}
                        <span className="hidden sm:inline" style={{ fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '15px' }}>
                            {reaction ? REACTION_TYPES.find(r => r.id === reaction)?.name : 'Thích'}
                        </span>
                    </button>
                </div>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex-1 flex items-center justify-center gap-2 py-[6px] rounded-md cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                        color: showComments ? '#1877F2' : isDark ? '#B0B3B8' : '#65676B',
                    }}
                >
                    <MessageCircle size={20} strokeWidth={1.75} />
                    <span className="hidden sm:inline" style={{ fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '15px' }}>
                        Bình luận
                    </span>
                </button>

                <button
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-[6px] rounded-md cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                        color: isDark ? '#B0B3B8' : '#65676B',
                    }}
                >
                    <Share size={20} strokeWidth={1.75} />
                    <span className="hidden sm:inline" style={{ fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '15px' }}>
                        Chia sẻ
                    </span>
                </button>
            </div>

            {/* Comments */}
            <CommentSection 
                postId={post.id} 
                isOpen={showComments} 
                onCountChange={(count) => {
                    setCommentCount(count);
                    if (onUpdatePost) {
                        onUpdatePost(post.id, { comment_count: count });
                    }
                }}
            />
            <ShareModal open={showShareModal} onClose={() => setShowShareModal(false)} post={post} />
        </motion.div>
    );
});
