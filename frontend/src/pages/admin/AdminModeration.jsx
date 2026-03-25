import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getPendingPosts, approvePost, rejectPost } from '../../api/admin';
import { getApiErrorMessage } from '../../api/axios';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { CheckCircle, XCircle, Clock, Image, UserCircle } from 'lucide-react';

export function AdminModeration() {
    const { isDark } = useTheme();
    const [posts, setPosts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await getPendingPosts(0, 50);
            setPosts(res.data.items || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải danh sách chờ duyệt'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleApprove = async (postId) => {
        try {
            const res = await approvePost(postId);
            toast.success(res.data.message || 'Đã duyệt bài viết');
            setPosts(prev => prev.filter(p => p.id !== postId));
            setTotal(prev => Math.max(0, prev - 1));
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể duyệt bài viết'));
        }
    };

    const handleReject = async (postId) => {
        const { value: reason, isConfirmed } = await Swal.fire({
            title: 'Từ chối bài viết',
            input: 'textarea',
            inputLabel: 'Lý do từ chối (tuỳ chọn)',
            inputPlaceholder: 'Nhập lý do...',
            showCancelButton: true,
            confirmButtonText: 'Từ chối',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#EF4444',
        });
        if (!isConfirmed) return;
        try {
            await rejectPost(postId, reason || '');
            toast.success('Đã từ chối bài viết');
            setPosts(prev => prev.filter(p => p.id !== postId));
            setTotal(prev => Math.max(0, prev - 1));
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể từ chối bài viết'));
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
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Duyệt Confession</h2>
                <p className="text-sm opacity-60">
                    Có <span className="font-bold" style={{ color: '#E53E3E' }}>{total}</span> bài đang chờ duyệt
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C53030', borderTopColor: 'transparent' }} />
                </div>
            ) : posts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                    style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                >
                    <CheckCircle size={48} className="mx-auto mb-4 opacity-30" />
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', fontWeight: 600 }}>Tất cả đã được duyệt!</p>
                    <p className="text-sm mt-1 opacity-70">Không có bài viết nào đang chờ xử lý.</p>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-3">
                    <AnimatePresence>
                        {posts.map((post, idx) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: idx * 0.05 }}
                                style={cardStyle}
                                className="overflow-hidden"
                            >
                                <div className="p-4 sm:p-5">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {post.is_anonymous ? (
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}>
                                                    <UserCircle size={22} style={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                                    style={{ background: 'linear-gradient(135deg, #C53030, #E53E3E)' }}>
                                                    {(post.author?.display_name || post.author?.student_id || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                                                        {post.author?.display_name || post.author?.student_id || 'Người dùng'}
                                                    </span>
                                                    {post.is_anonymous && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(100,116,139,0.15)', color: '#64748B' }}>
                                                            ẨN DANH
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: isDark ? '#475569' : '#94A3B8' }}>
                                                    <Clock size={11} />
                                                    <span>{new Date(post.created_at).toLocaleString('vi-VN')}</span>
                                                    {post.media_count > 0 && (
                                                        <span className="flex items-center gap-1"><Image size={11} /> {post.media_count} media</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <p style={{
                                        fontFamily: 'Inter, sans-serif',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.65,
                                        color: isDark ? '#CBD5E1' : '#374151',
                                        whiteSpace: 'pre-line',
                                        wordBreak: 'break-word',
                                    }}>
                                        {post.content}
                                    </p>

                                    {/* Media Preview */}
                                    {post.media && post.media.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {post.media.map((m) => (
                                                <div key={m.id} className="relative rounded-lg overflow-hidden" style={{ maxWidth: '200px', maxHeight: '200px' }}>
                                                    {m.media_type === 'video' ? (
                                                        <video
                                                            src={m.file_url}
                                                            controls
                                                            preload="metadata"
                                                            className="w-full h-full object-cover rounded-lg"
                                                            style={{ maxHeight: '200px' }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={m.file_url}
                                                            alt={m.file_name || 'media'}
                                                            className="w-full h-full object-cover rounded-lg cursor-pointer"
                                                            style={{ maxHeight: '200px' }}
                                                            onClick={() => window.open(m.file_url, '_blank')}
                                                        />
                                                    )}
                                                    <div 
                                                        className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                                        style={{ 
                                                            background: 'rgba(0,0,0,0.6)', 
                                                            color: '#fff',
                                                            backdropFilter: 'blur(4px)',
                                                        }}
                                                    >
                                                        {m.media_type === 'video' ? '🎬 Video' : '🖼️ Ảnh'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-4">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => handleApprove(post.id)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white cursor-pointer"
                                            style={{
                                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                                fontFamily: 'Inter, sans-serif',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                            }}
                                        >
                                            <CheckCircle size={16} />
                                            Duyệt
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => handleReject(post.id)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer"
                                            style={{
                                                background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
                                                color: '#EF4444',
                                                fontFamily: 'Inter, sans-serif',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                            }}
                                        >
                                            <XCircle size={16} />
                                            Từ chối
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
