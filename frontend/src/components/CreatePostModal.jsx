import { useState, useRef } from 'react';
import { X, PenSquare, Eye, EyeOff, ImagePlus, Music, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import api from '../api/axios';

export function CreatePostModal({ open, onClose, onPostCreated }) {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        const newFiles = selectedFiles.map((file) => {
            const isImage = file.type.startsWith('image/');
            return {
                file,
                preview: isImage ? URL.createObjectURL(file) : null,
                type: isImage ? 'image' : 'audio',
                name: file.name,
            };
        });
        setFiles((prev) => [...prev, ...newFiles]);
        e.target.value = '';
    };

    const removeFile = (index) => {
        setFiles((prev) => {
            const copy = [...prev];
            if (copy[index].preview) URL.revokeObjectURL(copy[index].preview);
            copy.splice(index, 1);
            return copy;
        });
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setLoading(true);
        try {
            // 1. Tạo post
            const postRes = await api.post('/posts/', { content, is_anonymous: isAnonymous });
            const postId = postRes.data.id;

            // 2. Upload từng file
            for (const f of files) {
                const formData = new FormData();
                formData.append('file', f.file);
                await api.post(`/media/upload/${postId}`, formData);
            }

            // 3. Lấy lại post đầy đủ (có media + author)
            const fullPost = await api.get(`/posts/${postId}`);

            // Dọn dẹp
            files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
            setContent('');
            setIsAnonymous(false);
            setFiles([]);
            onClose();
            if (onPostCreated) onPostCreated(fullPost.data);
        } catch (err) {
            console.error('Create post error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
        setContent('');
        setIsAnonymous(false);
        setFiles([]);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden"
                        style={{
                            background: isDark ? '#1A1A24' : '#FFFFFF',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                            maxHeight: '92dvh',
                            overflowY: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                                Viết Confession
                            </h2>
                            <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                                style={{ color: isDark ? '#64748B' : '#94A3B8', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                    style={{ background: isAnonymous ? (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0') : 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)' }}>
                                    {isAnonymous ? '🎭' : (user?.display_name || user?.student_id || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                                        {isAnonymous ? 'Ẩn danh' : (user?.display_name || user?.student_id)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: isDark ? '#64748B' : '#94A3B8' }}>
                                        {isAnonymous ? 'Không ai biết bạn là ai' : 'Đăng công khai'}
                                    </div>
                                </div>
                            </div>

                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Bạn muốn confession điều gì... ✨"
                                rows={4}
                                className="w-full resize-none outline-none"
                                style={{
                                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(197, 48, 48, 0.04)',
                                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(197, 48, 48, 0.12)',
                                    borderRadius: '12px', padding: '12px 16px', fontFamily: 'Inter, sans-serif',
                                    fontSize: '0.93rem', color: isDark ? '#F1F5F9' : '#1A1A2E', lineHeight: 1.6,
                                }}
                            />

                            {/* File Previews */}
                            {files.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {files.map((f, i) => (
                                        <div key={i} className="relative group">
                                            {f.type === 'image' ? (
                                                <img src={f.preview} alt="" className="w-20 h-20 rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1"
                                                    style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(197,48,48,0.08)' }}>
                                                    <Music size={20} style={{ color: '#E53E3E' }} />
                                                    <span className="text-xs truncate w-16 text-center" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                                                        {f.name}
                                                    </span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => removeFile(i)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ background: '#FF6B6B', color: 'white' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                            <div className="flex items-center gap-1">
                                {/* Anonymous Toggle */}
                                <button onClick={() => setIsAnonymous(!isAnonymous)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer"
                                    style={{
                                        background: isAnonymous ? 'rgba(229, 62, 62, 0.15)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        color: isAnonymous ? '#E53E3E' : isDark ? '#94A3B8' : '#64748B',
                                        fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.78rem',
                                    }}>
                                    {isAnonymous ? <EyeOff size={15} /> : <Eye size={15} />}
                                    {isAnonymous ? 'Ẩn danh' : 'Công khai'}
                                </button>

                                {/* Upload Media */}
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        color: isDark ? '#94A3B8' : '#64748B',
                                        fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.78rem',
                                    }}>
                                    <ImagePlus size={15} />
                                    Media
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,audio/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>

                            <motion.button onClick={handleSubmit} disabled={!content.trim() || loading}
                                whileHover={{ scale: 1.04, boxShadow: '0 6px 25px rgba(229, 62, 62, 0.45)' }}
                                whileTap={{ scale: 0.96 }}
                                className="px-6 py-2.5 rounded-xl text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)',
                                    boxShadow: '0 4px 15px rgba(229, 62, 62, 0.3)',
                                    fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.9rem',
                                }}>
                                {loading ? 'Đang đăng...' : 'Đăng'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
