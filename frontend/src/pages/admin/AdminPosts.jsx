import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Swal from 'sweetalert2';
import { adminDeletePost, adminDeleteComment } from '../../api/admin';
import { motion, AnimatePresence } from 'motion/react';
import api, { getApiErrorMessage } from '../../api/axios';
import { toast } from 'react-toastify';

export function AdminPosts() {
    const { isDark } = useTheme();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/posts/?skip=0&limit=50');
            setPosts(res.data);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải danh sách bài viết'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDeletePost = async (postId) => {
        const res = await Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa bài viết này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
        });
        if (!res.isConfirmed) return;
        try {
            await adminDeletePost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể xóa bài viết'));
        }
    };

    const handleDeleteComment = async (commentId, postId) => {
        const res = await Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa bình luận này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
        });
        if (!res.isConfirmed) return;
        try {
            await adminDeleteComment(commentId);
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId
                        ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) - 1) }
                        : p
                )
            );
            fetchPosts();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể xóa bình luận'));
        }
    };

    const cardStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        borderRadius: '16px',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Quản lý bài viết</h2>
                <p className="text-sm opacity-60">Kiểm duyệt nội dung bài đăng và bình luận trong hệ thống.</p>
            </div>

            {loading ? (
                <div className="text-center py-8" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Đang tải...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-8" style={{ color: isDark ? '#64748B' : '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    Không có bài viết nào.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {posts.map((post) => (
                        <PostAdminItem
                            key={post.id}
                            post={post}
                            isDark={isDark}
                            cardStyle={cardStyle}
                            onDeletePost={handleDeletePost}
                            onDeleteComment={handleDeleteComment}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function PostAdminItem({ post, isDark, cardStyle, onDeletePost, onDeleteComment }) {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await api.get(`/posts/${post.id}/comments`);
            setComments(res.data);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải bình luận'));
        } finally {
            setLoadingComments(false);
        }
    };

    const toggleComments = () => {
        if (!showComments && comments.length === 0) {
            fetchComments();
        }
        setShowComments(!showComments);
    };

    const author = post.author;
    const displayName = post.is_anonymous ? 'Ẩn danh' : (author?.display_name || author?.student_id || 'Người dùng');

    const renderComments = (commentList, depth = 0) =>
        commentList.map((c) => (
            <div key={c.id} style={{ marginLeft: depth * 16 }}>
                <div
                    className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg mb-1"
                    style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                >
                    <div className="min-w-0 flex-1">
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: isDark ? '#CBD5E1' : '#374151' }}>
                            {c.user?.display_name || c.user?.student_id || 'Người dùng'}
                        </span>
                        <p style={{ fontSize: '0.8rem', color: isDark ? '#94A3B8' : '#4B5563', wordBreak: 'break-word' }}>
                            {c.content}
                        </p>
                    </div>
                    <button
                        onClick={() => onDeleteComment(c.id, post.id)}
                        className="p-1.5 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        title="Xóa bình luận"
                        style={{ color: '#EF4444', background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)' }}
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
                {c.replies && c.replies.length > 0 && renderComments(c.replies, depth + 1)}
            </div>
        ));

    return (
        <div style={cardStyle} className="overflow-hidden">
            <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                            {displayName}
                        </span>
                        {post.is_anonymous && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(100,116,139,0.15)', color: '#64748B' }}>
                                ẨN DANH
                            </span>
                        )}
                    </div>
                    <p
                        style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.85rem',
                            lineHeight: 1.6,
                            color: isDark ? '#CBD5E1' : '#374151',
                            wordBreak: 'break-word',
                        }}
                    >
                        {post.content?.length > 150 ? post.content.slice(0, 150) + '...' : post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2" style={{ fontSize: '0.7rem', color: isDark ? '#64748B' : '#94A3B8' }}>
                        <span>❤️ {post.like_count || 0}</span>
                        <span>💬 {post.comment_count || 0}</span>
                    </div>
                </div>
                <button
                    onClick={() => onDeletePost(post.id)}
                    className="p-2 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    title="Xóa bài viết"
                    style={{ color: '#EF4444', background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)' }}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {(post.comment_count || 0) > 0 && (
                <button
                    onClick={toggleComments}
                    className="w-full px-4 py-2 text-left cursor-pointer transition-colors"
                    style={{
                        borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)',
                        fontSize: '0.78rem',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        color: '#E53E3E',
                        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    }}
                >
                    {showComments ? '▾ Ẩn bình luận' : '▸ Xem bình luận'}
                </button>
            )}

            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden px-4 pb-3"
                        style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)' }}
                    >
                        <div className="pt-2">
                            {loadingComments ? (
                                <div style={{ fontSize: '0.8rem', color: isDark ? '#64748B' : '#94A3B8' }}>Đang tải...</div>
                            ) : comments.length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: isDark ? '#64748B' : '#94A3B8' }}>Không có bình luận.</div>
                            ) : (
                                renderComments(comments)
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
