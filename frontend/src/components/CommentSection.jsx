import { useState, useEffect } from 'react';
import { Send, UserCircle, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import api from '../api/axios';

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

const CommentItem = ({ comment, postId, isDark, onReplySuccess, depth = 0 }) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(comment.user_liked);
    const [likeCount, setLikeCount] = useState(comment.like_count);
    const [isDeleting, setIsDeleting] = useState(false);
    const isOwner = user?.id === comment.user_id;

    const handleDelete = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;
        setIsDeleting(true);
        try {
            await api.delete(`/comments/${comment.id}`);
            onReplySuccess();
        } catch (err) {
            console.error('Lỗi khi xóa bình luận:', err);
            alert('Không thể xóa bình luận. Vui lòng thử lại sau.');
            setIsDeleting(false);
        }
    };
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    const handleLike = async () => {
        const prevLiked = isLiked;
        const prevCount = likeCount;
        setIsLiked(!prevLiked);
        setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
        try {
            await api.post(`/comments/${comment.id}/like`);
        } catch (error) {
            setIsLiked(prevLiked);
            setLikeCount(prevCount);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() || sendingReply) return;
        setSendingReply(true);
        try {
            await api.post(`/posts/${postId}/comments`, {
                content: replyContent,
                parent_id: comment.id
            });
            setReplyContent('');
            setIsReplying(false);
            onReplySuccess();
        } catch (error) {
            console.error('Create reply error:', error);
        } finally {
            setSendingReply(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col gap-2 relative"
        >
            {depth > 0 && (
                <div
                    className="absolute left-[-16px] top-[-10px] bottom-4 w-4 rounded-bl-xl"
                    style={{ borderLeft: '2px solid', borderBottom: '2px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                />
            )}

            <div className="flex gap-2 relative z-10">
                <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #E53E3E 0%, #C53030 100%)' }}
                >
                    {(comment.user?.display_name || comment.user?.student_id || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div
                        className="px-3 py-2 rounded-xl inline-block text-left"
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                color: isDark ? '#CBD5E1' : '#374151',
                                display: 'block'
                            }}
                        >
                            {comment.user?.display_name || comment.user?.student_id || 'Người dùng'}
                        </span>
                        <p
                            style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.82rem',
                                lineHeight: 1.5,
                                color: isDark ? '#94A3B8' : '#4B5563',
                                marginTop: '2px',
                                wordBreak: 'break-word'
                            }}
                        >
                            {comment.content}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-1" style={{ fontSize: '0.7rem', color: isDark ? '#64748B' : '#94A3B8', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        <span>{timeAgo(comment.created_at)}</span>
                        <button
                            onClick={handleLike}
                            className="flex items-center gap-1 hover:text-[#f43f5e] transition-colors"
                            style={{ color: isLiked ? '#f43f5e' : '' }}
                        >
                            <Heart size={12} fill={isLiked ? '#f43f5e' : 'none'} />
                            <span>{likeCount > 0 ? likeCount : 'Thích'}</span>
                        </button>
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1 hover:text-[#C53030] transition-colors"
                        >
                            <MessageCircle size={12} />
                            <span>Phản hồi</span>
                        </button>
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-1 hover:text-[#f43f5e] transition-colors disabled:opacity-40"
                            >
                                <Trash2 size={12} />
                                <span>{isDeleting ? 'Đang xóa...' : 'Xóa'}</span>
                            </button>
                        )}
                    </div>

                    {isReplying && (
                        <AnimatePresence>
                            <motion.form
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                onSubmit={handleReplySubmit}
                                className="flex items-center gap-2 mt-2 mb-2"
                            >
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Viết phản hồi..."
                                    className="flex-1 px-3 py-1.5 rounded-lg outline-none text-xs"
                                    autoFocus
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(79, 142, 247, 0.05)',
                                        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(79, 142, 247, 0.12)',
                                        color: isDark ? '#F1F5F9' : '#1A1A2E',
                                        fontFamily: 'Inter, sans-serif',
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!replyContent.trim() || sendingReply}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-40"
                                    style={{ background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)', color: 'white' }}
                                >
                                    <Send size={12} />
                                </button>
                            </motion.form>
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Render Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="pl-6 mt-1 flex flex-col gap-3 relative">
                    {depth === 0 && (
                        <div
                            className="absolute left-[13px] top-0 bottom-6 w-0.5"
                            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                        />
                    )}
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            isDark={isDark}
                            onReplySuccess={onReplySuccess}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export function CommentSection({ postId, isOpen }) {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, postId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/posts/${postId}/comments`);
            setComments(res.data);
        } catch (err) {
            console.error('Fetch comments error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || sending) return;
        setSending(true);
        try {
            await api.post(`/posts/${postId}/comments`, { content: newComment });
            setNewComment('');
            fetchComments();
        } catch (err) {
            console.error('Create comment error:', err);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
            >
                <div
                    className="px-3 sm:px-5 py-3"
                    style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)' }}
                >
                    {/* Comment Input */}
                    <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)' }}
                        >
                            {(user?.display_name || user?.student_id || 'U').charAt(0).toUpperCase()}
                        </div>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Viết bình luận..."
                            className="flex-1 px-3 py-2 rounded-xl outline-none"
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(229, 62, 62, 0.05)',
                                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(229, 62, 62, 0.12)',
                                color: isDark ? '#F1F5F9' : '#1A1A2E',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '16px',
                            }}
                        />
                        <motion.button
                            type="submit"
                            disabled={!newComment.trim() || sending}
                            whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-40"
                            style={{
                                background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)',
                                color: 'white',
                            }}
                        >
                            <Send size={14} />
                        </motion.button>
                    </form>

                    {/* Comments List */}
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C53030', borderTopColor: 'transparent' }} />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-3" style={{ color: isDark ? '#475569' : '#94A3B8', fontSize: '0.82rem' }}>
                            Chưa có bình luận nào
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                            {comments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    postId={postId}
                                    isDark={isDark}
                                    onReplySuccess={fetchComments}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
