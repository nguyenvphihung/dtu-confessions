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

    const fetchPosts = useCallback(async (cursorOrSkip = 0, append = false) => {
        try {
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            // If append is true, cursorOrSkip is treated as cursor (lastPost.id)
            // If append is false, cursorOrSkip is treated as skip (0) for fresh load
            const paginationParam = append ? `cursor=${cursorOrSkip}` : `skip=${cursorOrSkip}`;
            const res = await api.get(`/posts/?${paginationParam}&limit=20${searchParam}`);
            if (res.data.length < 20) setHasMore(false);
            setPosts((prev) => append ? [...prev, ...res.data] : res.data);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải bài viết'));
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Use the shared hook to perform a fetch on mount.
    useFetchOnMount(() => {
        if (!searchQuery) {
            const cachedPosts = sessionStorage.getItem('feed_posts_cache');
            const cachedPage = sessionStorage.getItem('feed_page_cache');
            const cachedHasMore = sessionStorage.getItem('feed_has_more_cache');

            if (cachedPosts && cachedPage) {
                try {
                    const parsedPosts = JSON.parse(cachedPosts);
                    if (parsedPosts.length > 0) {
                        setPosts(parsedPosts);
                        setPage(parseInt(cachedPage, 10));
                        setHasMore(cachedHasMore === 'true');
                        setLoading(false);
                        
                        setTimeout(() => {
                            const savedScroll = sessionStorage.getItem('feed_scroll_pos');
                            if (savedScroll) {
                                window.scrollTo(0, parseInt(savedScroll, 10));
                            }
                        }, 50);
                        return;
                    }
                } catch (e) {
                    console.error("Feed cache read error", e);
                }
            }
        }

        setPage(0);
        setHasMore(true);
        setLoading(true);
        setPosts([]);
        fetchPosts(0, false);
    }, [searchQuery]);

    // Continuously save scroll position back to cache when not searching
    useEffect(() => {
        const handleScroll = () => {
            if (!searchQuery && posts.length > 0) {
                sessionStorage.setItem('feed_scroll_pos', window.scrollY.toString());
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [searchQuery, posts.length]);

    // Save fetched posts to cache seamlessly
    useEffect(() => {
        if (!searchQuery && posts.length > 0) {
            sessionStorage.setItem('feed_posts_cache', JSON.stringify(posts));
            sessionStorage.setItem('feed_page_cache', page.toString());
            sessionStorage.setItem('feed_has_more_cache', hasMore.toString());
        }
    }, [posts, page, hasMore, searchQuery]);

    const observerTarget = useRef(null);

    const handleLoadMore = useCallback(() => {
        if (loading || !hasMore || posts.length === 0) return;
        setLoading(true);
        const lastPost = posts[posts.length - 1];
        setPage(page + 1);
        fetchPosts(lastPost.id, true);
    }, [loading, hasMore, page, fetchPosts, posts]);

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
                            onUpdatePost={(id, updates) => setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))}
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
