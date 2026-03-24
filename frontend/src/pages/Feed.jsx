import { useState, useEffect, useCallback, useRef } from 'react';
import { useFetchOnMount } from '../hooks/useFetchOnMount';
import { useSearchParams } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import { CreatePostModal } from '../components/CreatePostModal';
import { UserAvatar } from '../components/UserAvatar';
import { ReelsBar } from '../components/ReelsBar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import api, { getApiErrorMessage } from '../api/axios';
import { toast } from 'react-toastify';

export function Feed() {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const fetchPosts = useCallback(async (skip = 0, append = false) => {
        try {
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            const res = await api.get(`/posts/?skip=${skip}&limit=20${searchParam}`);
            if (res.data.length < 20) setHasMore(false);
            setPosts((prev) => append ? [...prev, ...res.data] : res.data);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải bài viết'));
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Use the shared hook to perform a fetch on mount. Depend on `searchQuery`
    // (primitive) instead of the `fetchPosts` function reference to avoid
    // re-running when unrelated parents re-render and re-create the callback.
    useFetchOnMount(() => {
        setPage(0);
        setHasMore(true);
        setLoading(true);
        setPosts([]);
        fetchPosts(0, false);
    }, [searchQuery]);

    const observerTarget = useRef(null);

    const handleLoadMore = useCallback(() => {
        if (loading || !hasMore) return;
        setLoading(true);
        const newPage = page + 1;
        setPage(newPage);
        fetchPosts(newPage * 20, true);
    }, [loading, hasMore, page, fetchPosts]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, handleLoadMore]);

    const handlePostCreated = (newPost) => {
        if (newPost) {
            setPosts((prev) => [newPost, ...prev]);
        } else {
            setPage(0);
            setHasMore(true);
            fetchPosts(0, false);
        }
    };

    const cardStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        boxShadow: isDark
            ? '0 2px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    };

    return (
        <div>
            {!searchQuery && <ReelsBar isDark={isDark} />}
            {/* Quick Post */}
            {!searchQuery && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{ y: -2, boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)' : '0 8px 30px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)' }}
                    className="rounded-2xl px-4 py-4 mb-3 cursor-pointer"
                    style={{ ...cardStyle, transition: 'box-shadow 0.3s ease' }}
                    onClick={() => setShowCreate(true)}
                >
                    <div className="flex items-center gap-3">
                        <UserAvatar 
                            user={user}
                            sizeClasses="w-11 h-11"
                            fontSize="1rem"
                        />
                        <div
                            className="flex-1 px-4 py-2.5 rounded-xl cursor-text transition-colors"
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(79, 142, 247, 0.05)',
                                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(79, 142, 247, 0.12)',
                                color: isDark ? '#475569' : '#94A3B8',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.9rem',
                            }}
                        >
                            Bạn muốn confession điều gì? ✨
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 cursor-pointer"
                            style={{
                                background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)',
                                boxShadow: '0 4px 15px rgba(229, 62, 62, 0.35)',
                            }}
                        >
                            <PenSquare size={18} />
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Posts */}
            {loading && page === 0 ? (
                <div>
                    {[1, 2, 3].map((n) => (
                        <PostSkeleton key={n} />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-12"
                    style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                >
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem' }}>Chưa có confession nào</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Hãy là người đầu tiên chia sẻ!</p>
                </motion.div>
            ) : (
                <div>
                    {posts.map((post, index) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            index={index}
                            onDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
                        />
                    ))}
                </div>
            )}

            {/* Load More */}
            {hasMore && posts.length > 0 && (
                <div ref={observerTarget} className="flex justify-center py-6">
                    {loading && page > 0 ? (
                        <div
                            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: '#C53030', borderTopColor: 'transparent' }}
                        />
                    ) : (
                        <div style={{ height: '40px' }}></div>
                    )}
                </div>
            )}

            <CreatePostModal open={showCreate} onClose={() => setShowCreate(false)} onPostCreated={handlePostCreated} />
        </div>
    );
}
