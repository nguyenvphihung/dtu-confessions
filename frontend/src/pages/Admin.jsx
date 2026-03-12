import { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff, Trash2, UserCog, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getUsers, changeUserRole, toggleBanUser, adminDeletePost, adminDeleteComment } from '../api/admin';
import { motion, AnimatePresence } from 'motion/react';
import api from '../api/axios';

const TABS = [
    { id: 'users', label: 'Người dùng', icon: UserCog },
    { id: 'posts', label: 'Bài viết', icon: Trash2 },
];

export function Admin() {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-64">
                <p style={{ color: isDark ? '#94A3B8' : '#64748B', fontFamily: 'Inter, sans-serif' }}>
                    Bạn không có quyền truy cập trang này.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4">
            <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="text-2xl mb-6"
                style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    color: isDark ? '#F1F5F9' : '#1A1A2E',
                }}
            >
                Quản lý hệ thống
            </motion.h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <motion.button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
                        style={{
                            background: activeTab === id
                                ? 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)'
                                : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            color: activeTab === id ? 'white' : isDark ? '#94A3B8' : '#64748B',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            transition: 'background 0.3s ease, color 0.3s ease',
                        }}
                    >
                        <Icon size={16} />
                        {label}
                    </motion.button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'users' && (
                    <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                        <UsersTab isDark={isDark} />
                    </motion.div>
                )}
                {activeTab === 'posts' && (
                    <motion.div key="posts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                        <PostsTab isDark={isDark} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function UsersTab({ isDark }) {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 20;

    const fetchUsers = async (skip = 0, searchQuery = search) => {
        setLoading(true);
        try {
            const res = await getUsers(skip, limit, searchQuery);
            const data = res.data.items || res.data;
            setUsers(data);
            setHasMore(data.length === limit);
        } catch (err) {
            console.error('Lỗi tải danh sách người dùng:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(0, '');
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        fetchUsers(0, search);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchUsers(newPage * limit, search);
    };

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!window.confirm(`Đổi vai trò thành "${newRole}"?`)) return;
        try {
            await changeUserRole(userId, newRole);
            fetchUsers(page * limit, search);
        } catch (err) {
            console.error('Lỗi đổi vai trò:', err);
            alert('Không thể đổi vai trò. Vui lòng thử lại.');
        }
    };

    const handleBanToggle = async (userId, isBanned) => {
        const action = isBanned ? 'bỏ cấm' : 'cấm';
        if (!window.confirm(`Bạn có chắc chắn muốn ${action} người dùng này?`)) return;
        try {
            await toggleBanUser(userId, !isBanned);
            fetchUsers(page * limit, search);
        } catch (err) {
            console.error('Lỗi cấm/bỏ cấm:', err);
            alert('Không thể thực hiện. Vui lòng thử lại.');
        }
    };

    const cardStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        borderRadius: '16px',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
    };

    return (
        <div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm theo tên hoặc MSSV..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none"
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                            color: isDark ? '#F1F5F9' : '#1A1A2E',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.875rem',
                        }}
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-white cursor-pointer"
                    style={{
                        background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                    }}
                >
                    Tìm
                </button>
            </form>

            {loading ? (
                <div className="text-center py-8" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Đang tải...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-8" style={{ color: isDark ? '#64748B' : '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    Không tìm thấy người dùng nào.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {users.map((u) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: users.indexOf(u) * 0.04, duration: 0.3 }}
                            whileHover={{ y: -2, boxShadow: isDark ? '0 6px 25px rgba(0,0,0,0.3)' : '0 6px 25px rgba(0,0,0,0.08)' }}
                            className="p-4 flex items-center justify-between gap-3"
                            style={cardStyle}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                    style={{ background: u.role === 'admin' ? 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' : 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)' }}
                                >
                                    {(u.display_name || u.student_id || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="truncate"
                                            style={{
                                                fontFamily: 'Poppins, sans-serif',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                color: isDark ? '#F1F5F9' : '#1A1A2E',
                                            }}
                                        >
                                            {u.display_name || u.student_id}
                                        </span>
                                        {u.role === 'admin' && (
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}
                                            >
                                                ADMIN
                                            </span>
                                        )}
                                        {u.is_banned && (
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}
                                            >
                                                BỊ CẤM
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748B' : '#94A3B8' }}>
                                        MSSV: {u.student_id}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleRoleChange(u.id, u.role)}
                                    title={u.role === 'admin' ? 'Hạ quyền' : 'Nâng quyền Admin'}
                                    className="p-2 rounded-lg transition-colors cursor-pointer"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                        color: u.role === 'admin' ? '#F59E0B' : isDark ? '#94A3B8' : '#64748B',
                                    }}
                                >
                                    {u.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                </button>
                                <button
                                    onClick={() => handleBanToggle(u.id, u.is_banned)}
                                    title={u.is_banned ? 'Bỏ cấm' : 'Cấm người dùng'}
                                    className="p-2 rounded-lg transition-colors cursor-pointer"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                        color: u.is_banned ? '#22C55E' : '#EF4444',
                                    }}
                                >
                                    {u.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-3 mt-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 0}
                            className="p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: isDark ? '#94A3B8' : '#64748B' }}>
                            Trang {page + 1}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={!hasMore}
                            className="p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PostsTab({ isDark }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/posts/?skip=0&limit=50');
            setPosts(res.data);
        } catch (err) {
            console.error('Lỗi tải bài viết:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
        try {
            await adminDeletePost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
        } catch (err) {
            console.error('Lỗi xóa bài viết:', err);
            alert('Không thể xóa bài viết. Vui lòng thử lại.');
        }
    };

    const handleDeleteComment = async (commentId, postId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
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
            console.error('Lỗi xóa bình luận:', err);
            alert('Không thể xóa bình luận. Vui lòng thử lại.');
        }
    };

    const cardStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        borderRadius: '16px',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
    };

    return (
        <div>
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
            console.error('Lỗi tải bình luận:', err);
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

            {/* Toggle Comments */}
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
