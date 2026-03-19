import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PostCard } from '../components/PostCard';
import { Calendar, Mail, Hash, Camera, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import api, { getApiErrorMessage } from '../api/axios';
import { toast } from 'react-toastify';
import { uploadProfileImage } from '../api/media';
import { updateProfile } from '../api/auth';

export function Profile() {
    const { isDark } = useTheme();
    const { user, refreshUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const uploadRes = await uploadProfileImage(file);
            await updateProfile({ avatar_url: uploadRes.data.data.file_url });
            await refreshUser();
            toast.success('Cập nhật avatar thành công');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Lỗi cập nhật avatar'));
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    };

    const handleCoverUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingCover(true);
        try {
            const uploadRes = await uploadProfileImage(file);
            await updateProfile({ cover_url: uploadRes.data.data.file_url });
            await refreshUser();
            toast.success('Cập nhật ảnh bìa thành công');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Lỗi cập nhật ảnh bìa'));
        } finally {
            setUploadingCover(false);
            e.target.value = '';
        }
    };

    useEffect(() => {
        const fetchMyPosts = async () => {
            try {
                const res = await api.get('/posts/?skip=0&limit=100');
                const myPosts = res.data.filter((p) => p.author_id === user?.id);
                setPosts(myPosts);
            } catch (err) {
                toast.error(getApiErrorMessage(err, 'Không thể tải bài viết của bạn'));
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchMyPosts();
    }, [user]);

    const cardStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        boxShadow: isDark
            ? '0 2px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    };

    return (
        <div>
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className="rounded-2xl overflow-hidden mb-4"
                style={cardStyle}
            >
                {/* Cover */}
                <div
                    onClick={() => coverInputRef.current?.click()}
                    className="h-24 sm:h-32 relative group cursor-pointer overflow-hidden"
                    style={{ background: user?.cover_url ? `url(${user.cover_url}) center/cover` : 'linear-gradient(135deg, #C53030 0%, #E53E3E 50%, #FF6B6B 100%)' }}
                >
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        {uploadingCover ? <Loader2 className="animate-spin" /> : <Camera size={28} />}
                    </div>
                </div>
                <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={handleCoverUpload} />

                {/* Profile Info */}
                <div className="px-4 sm:px-5 pb-5">
                    <div className="flex items-end gap-3 sm:gap-4 -mt-10 mb-4 relative z-10">
                        <div
                            onClick={() => avatarInputRef.current?.click()}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 group cursor-pointer relative overflow-hidden bg-cover bg-center"
                            style={{
                                backgroundImage: user?.avatar_url ? `url(${user.avatar_url})` : 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)',
                                borderColor: isDark ? '#1A1A24' : '#FFFFFF',
                            }}
                        >
                            {!user?.avatar_url && (user?.display_name || user?.student_id || 'U').charAt(0).toUpperCase()}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {uploadingAvatar ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                            </div>
                        </div>
                        <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                    </div>

                    <h1
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 700,
                            fontSize: '1.15rem',
                            color: isDark ? '#F1F5F9' : '#1A1A2E',
                        }}
                    >
                        {user?.display_name || user?.student_id}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5" style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.82rem' }}>
                            <Hash size={14} />
                            <span>{user?.student_id}</span>
                        </div>
                        {user?.email && (
                            <div className="flex items-center gap-1.5" style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.82rem' }}>
                                <Mail size={14} />
                                <span>{user?.email}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5" style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.82rem' }}>
                            <Calendar size={14} />
                            <span>Tham gia {new Date(user?.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-4">
                        <div>
                            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                                {posts.length}
                            </span>
                            <span style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.82rem', marginLeft: '4px' }}>
                                bài viết
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* My Posts */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mb-3"
            >
                <h2
                    className="px-2 mb-3"
                    style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: isDark ? '#F1F5F9' : '#1A1A2E',
                    }}
                >
                    Bài viết của tôi
                </h2>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C53030', borderTopColor: 'transparent' }} />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem' }}>Bạn chưa đăng confession nào</p>
                </div>
            ) : (
                posts.map((post, index) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        index={index}
                        onDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
                    />
                ))
            )}
        </div>
    );
}
