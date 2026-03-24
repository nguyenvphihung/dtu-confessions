import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Globe, MessageCircle, Phone, Link, Users, User, Twitter, Smile } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { UserAvatar } from './UserAvatar';
import api from '../api/axios';
import { getApiErrorMessage } from '../api/axios';

export function ShareModal({ open, onClose, post }) {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!open) return null;

    const originalPostId = post.shared_post ? post.shared_post.id : post.id;

    const handleShare = async () => {
        if (!user) {
            toast.error('Bạn cần đăng nhập để chia sẻ');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/posts/', {
                content: content.trim() || " ", // backend might require some content, space is fallback
                is_anonymous: false,
                is_private: isPrivate,
                shared_post_id: originalPostId
            });
            toast.success('Chia sẻ bài viết thành công!');
            setContent('');
            onClose();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Lỗi chia sẻ bài viết'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/post/${originalPostId}`;
        navigator.clipboard.writeText(link);
        toast.success('Đã sao chép liên kết!');
    };

    const modalContent = (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
                        style={{
                            background: isDark ? '#242526' : '#FFFFFF',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-center py-4 border-b relative" style={{ borderColor: isDark ? '#3E4042' : '#E5E7EB' }}>
                            <h2 className="text-xl font-bold" style={{ color: isDark ? '#E4E6EB' : '#1C1E21' }}>Chia sẻ</h2>
                            <button
                                onClick={onClose}
                                className="absolute right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                                style={{
                                    background: isDark ? '#3A3B3C' : '#E4E6EB',
                                    color: isDark ? '#B0B3B8' : '#606770'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 flex flex-col gap-3">
                            {/* User Info & Privacy */}
                            <div className="flex items-center gap-3">
                                <UserAvatar 
                                    user={user} 
                                    sizeClasses="w-12 h-12 flex-shrink-0"
                                    fontSize="1.125rem"
                                />
                                <div>
                                    <div className="font-semibold text-base mb-1" style={{ color: isDark ? '#E4E6EB' : '#1C1E21' }}>
                                        {user?.display_name || user?.student_id}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2.5 py-1 text-xs font-semibold rounded-md flex items-center" style={{ background: isDark ? '#3A3B3C' : '#E4E6EB', color: isDark ? '#E4E6EB' : '#1C1E21' }}>
                                            Bảng feed
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors hover:opacity-80"
                                                style={{ background: isDark ? '#3A3B3C' : '#E4E6EB', color: isDark ? '#E4E6EB' : '#1C1E21' }}
                                            >
                                                {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
                                                {isPrivate ? 'Chỉ mình tôi' : 'Công khai'}
                                                <span className="ml-1 text-[10px]">▼</span>
                                            </button>
                                            
                                            {showPrivacyDropdown && (
                                                <div className="absolute top-full left-0 mt-1 w-32 rounded-lg shadow-lg py-1 z-10" style={{ background: isDark ? '#3A3B3C' : '#FFFFFF', border: isDark ? 'none' : '1px solid #E5E7EB' }}>
                                                    <button onClick={() => { setIsPrivate(false); setShowPrivacyDropdown(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-black/10 flex items-center gap-2" style={{ color: isDark ? '#E4E6EB' : '#1C1E21' }}>
                                                        <Globe size={14} /> Công khai
                                                    </button>
                                                    <button onClick={() => { setIsPrivate(true); setShowPrivacyDropdown(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-black/10 flex items-center gap-2" style={{ color: isDark ? '#E4E6EB' : '#1C1E21' }}>
                                                        <Lock size={14} /> Chỉ mình tôi
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Text Input */}
                            <div className="relative mt-2">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Hãy nói gì đó về nội dung này..."
                                    className="w-full bg-transparent outline-none resize-none pt-2 pb-12 text-lg"
                                    style={{ color: isDark ? '#E4E6EB' : '#1C1E21', minHeight: '100px' }}
                                />
                                <div className="absolute right-0 bottom-16 opacity-50 cursor-pointer hover:opacity-100 transition-opacity">
                                    <Smile size={24} style={{ color: isDark ? '#B0B3B8' : '#606770' }} />
                                </div>
                                <div className="absolute right-0 bottom-2">
                                    <button
                                        onClick={handleShare}
                                        disabled={isSubmitting}
                                        className="px-6 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                                        style={{ 
                                            background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)',
                                            boxShadow: '0 4px 15px rgba(229, 62, 62, 0.35)'
                                        }}
                                    >
                                        {isSubmitting ? 'Đang chia sẻ...' : 'Chia sẻ ngay'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t" style={{ borderColor: isDark ? '#3E4042' : '#E5E7EB' }} />

                        {/* Social Shares */}
                        <div className="p-4 pt-5 pb-6">
                            <h3 className="text-[15px] font-semibold mb-4" style={{ color: isDark ? '#E4E6EB' : '#1C1E21', fontFamily: 'Inter, sans-serif' }}>
                                Chia sẻ lên
                            </h3>
                            <div className="flex items-start justify-between px-1">
                                {[
                                    { id: 'messenger', icon: MessageCircle, label: 'Messenger', bg: isDark ? '#3A3B3C' : '#E4E6EB' },
                                    { id: 'whatsapp', icon: Phone, label: 'WhatsApp', bg: isDark ? '#3A3B3C' : '#E4E6EB' },
                                    { id: 'copy', icon: Link, label: 'Sao chép liên kết', bg: isDark ? '#3A3B3C' : '#E4E6EB', onClick: handleCopyLink },
                                    { id: 'group', icon: Users, label: 'Nhóm', bg: isDark ? '#3A3B3C' : '#E4E6EB' },
                                    { id: 'friend', icon: User, label: 'Trang cá nhân của bạn bè', bg: isDark ? '#3A3B3C' : '#E4E6EB' },
                                    { id: 'x', icon: Twitter, label: 'X', bg: isDark ? '#3A3B3C' : '#E4E6EB' },
                                ].map((item) => (
                                    <div key={item.id} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={item.onClick || null}>
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: item.bg }}>
                                            <item.icon size={20} style={{ color: isDark ? '#E4E6EB' : '#1C1E21' }} />
                                        </div>
                                        <span className="text-[11px] text-center w-14 break-words leading-tight" style={{ color: isDark ? '#E4E6EB' : '#1C1E21' }}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
