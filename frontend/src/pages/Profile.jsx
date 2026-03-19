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
import { useParams } from 'react-router-dom';

export function Profile() {
    const { userId } = useParams();
    const { isDark } = useTheme();
    const { user: authUser, refreshUser } = useAuth();
    
    // Determine the user to show
    const isOwner = !userId || parseInt(userId) === authUser?.id;
    const [profileUser, setProfileUser] = useState(isOwner ? authUser : null);
    
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const handleAvatarUpload = async (e) => {
        if (!isOwner) return;
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
        if (!isOwner) return;
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
        if (isOwner) {
            setProfileUser(authUser);
        } else if (userId) {
            api.get(`/users/${userId}`).then(res => {
                setProfileUser(res.data);
            }).catch(err => {
                toast.error(getApiErrorMessage(err, 'Không thể tải thông tin người dùng'));
            });
        }
    }, [userId, authUser, isOwner]);

    useEffect(() => {
        const fetchPosts = async () => {
            const targetId = isOwner ? authUser?.id : userId;
            if (!targetId) return;
            try {
                const res = await api.get(`/posts/user/${targetId}?skip=0&limit=100`);
                setPosts(res.data);
            } catch (err) {
                toast.error(getApiErrorMessage(err, 'Không thể tải bài viết'));
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [userId, isOwner, authUser]);

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
                    onClick={() => isOwner && coverInputRef.current?.click()}
                    className={`h-24 sm:h-32 relative ${isOwner ? 'group cursor-pointer' : ''} overflow-hidden`}
                    style={{ background: profileUser?.cover_url ? `url(${profileUser.cover_url}) center/cover` : 'linear-gradient(135deg, #C53030 0%, #E53E3E 50%, #FF6B6B 100%)' }}
                >
                    {isOwner && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            {uploadingCover ? <Loader2 className="animate-spin" /> : <Camera size={28} />}
                        </div>
                    )}
                </div>
                {isOwner && <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={handleCoverUpload} />}

                {/* Profile Info */}
                <div className="px-4 sm:px-5 pb-5">
                    <div className="flex items-end gap-3 sm:gap-4 -mt-10 mb-4 relative z-10">
                        <div
                            onClick={() => {
                                if (isOwner) {
                                    avatarInputRef.current?.click();
                                } else if (profileUser?.avatar_url) {
                                    window.open(profileUser.avatar_url, '_blank');
                                }
                            }}
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 ${isOwner ? 'group cursor-pointer' : (profileUser?.avatar_url ? 'cursor-pointer' : '')} relative overflow-hidden bg-cover bg-center`}
                            style={{
                                backgroundImage: profileUser?.avatar_url ? `url(${profileUser.avatar_url})` : 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)',
                                borderColor: isDark ? '#1A1A24' : '#FFFFFF',
                            }}
                        >
                            {!profileUser?.avatar_url && (profileUser?.display_name || profileUser?.student_id || 'U').charAt(0).toUpperCase()}
                            {isOwner && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {uploadingAvatar ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                                </div>
                            )}
                        </div>
                        {isOwner && <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />}
                    </div>

                    <h1
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 700,
                            fontSize: '1.15rem',
                            color: isDark ? '#F1F5F9' : '#1A1A2E',
                        }}
                    >
                        {profileUser?.display_name || profileUser?.student_id}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5" style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.82rem' }}>
                            <Hash size={14} />
                            <span>{profileUser?.student_id}</span>
                        </div>
                        {profileUser?.email && (
                            <div className="flex items-center gap-1.5" style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.82rem' }}>
                                <Mail size={14} />
                                <span>{profileUser?.email}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5" style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: '0.82rem' }}>
                            <Calendar size={14} />
                            <span>Tham gia {profileUser?.created_at ? new Date(profileUser.created_at).toLocaleDateString('vi-VN') : ''}</span>
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
                    {isOwner ? 'Bài viết của tôi' : `Bài viết của ${profileUser?.display_name || profileUser?.student_id || 'Người dùng'}`}
                </h2>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C53030', borderTopColor: 'transparent' }} />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem' }}>{isOwner ? 'Bạn chưa đăng confession nào' : 'Chưa có bài viết nào'}</p>
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
