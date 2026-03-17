import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, ChevronLeft } from 'lucide-react';
import { getDailyReels, trackReelAnalytics, trackReelView } from '../api/reels';
import { getApiErrorMessage } from '../api/axios';
import { toast } from 'react-toastify';
import { CommentSection } from '../components/CommentSection';

function ReelItem({ item, active, onLike, onShare, onWatch, onSwipeLeft, onNearEnd }) {
    const videoRef = useRef(null);
    const [showComments, setShowComments] = useState(false);
    const [liked, setLiked] = useState(Boolean(item.user_liked));
    const [likeCount, setLikeCount] = useState(item.like_count || 0);
    const [touch, setTouch] = useState({ x: 0, t: 0 });
    const [lastTap, setLastTap] = useState(0);
    const watchStartRef = useRef(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (active) {
            video.play().catch(() => {});
            watchStartRef.current = Date.now();
        } else {
            video.pause();
            if (watchStartRef.current) {
                const seconds = (Date.now() - watchStartRef.current) / 1000;
                onWatch(item.media_id, seconds);
                watchStartRef.current = 0;
            }
        }
    }, [active]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onTime = () => {
            if (video.duration > 0 && video.currentTime / video.duration > 0.85) onNearEnd();
        };
        video.addEventListener('timeupdate', onTime);
        return () => video.removeEventListener('timeupdate', onTime);
    }, [onNearEnd]);

    const handleLike = async () => {
        const prev = liked;
        setLiked(!liked);
        setLikeCount((v) => v + (liked ? -1 : 1));
        try {
            const res = await onLike(item.media_id);
            const status = res?.data?.data?.status;
            const likes = res?.data?.data?.like_count;
            if (typeof likes === 'number') setLikeCount(likes);
            if (status === 'unliked') setLiked(false);
            if (status === 'like') setLiked(true);
        } catch {
            setLiked(prev);
            setLikeCount((v) => v + (prev ? 1 : -1));
        }
    };

    const handleTap = () => {
        const now = Date.now();
        if (now - lastTap < 260) {
            handleLike();
        }
        setLastTap(now);
    };

    const handleTouchStart = (e) => {
        const t = e.touches[0];
        setTouch({ x: t.clientX, t: Date.now() });
    };

    const handleTouchEnd = (e) => {
        const t = e.changedTouches[0];
        const deltaX = t.clientX - touch.x;
        const deltaT = Date.now() - touch.t;
        if (deltaX < -80 && deltaT < 400) onSwipeLeft();
    };

    return (
        <section className="relative h-screen w-full snap-start bg-black" onDoubleClick={handleLike}>
            <video
                ref={videoRef}
                src={item.file_url}
                className="h-full w-full object-cover"
                playsInline
                loop
                preload="metadata"
                muted={false}
                onClick={handleTap}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
            <div className="absolute bottom-22 left-4 text-white">
                <div className="font-semibold">{item.author?.display_name || item.author?.student_id || 'Ẩn danh'}</div>
                <div className="text-sm opacity-85">{item.view_count || 0} views</div>
            </div>
            <div className="absolute right-3 bottom-24 flex flex-col gap-4 text-white">
                <button onClick={handleLike} className="cursor-pointer flex flex-col items-center">
                    <Heart size={26} fill={liked ? '#E53E3E' : 'none'} color={liked ? '#E53E3E' : '#fff'} />
                    <span className="text-xs">{likeCount}</span>
                </button>
                <button onClick={() => setShowComments((v) => !v)} className="cursor-pointer flex flex-col items-center">
                    <MessageCircle size={26} />
                </button>
                <button onClick={() => onShare(item)} className="cursor-pointer flex flex-col items-center">
                    <Share2 size={26} />
                </button>
            </div>
            {showComments && (
                <div className="absolute inset-x-0 bottom-0 max-h-[58vh] rounded-t-2xl bg-[#0F0F17] p-3 overflow-y-auto">
                    <CommentSection postId={item.post_id} />
                </div>
            )}
        </section>
    );
}

export default function Reels() {
    const [searchParams] = useSearchParams();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const targetMediaId = Number(searchParams.get('media') || 0);

    const date = useMemo(() => new Date().toISOString().slice(0, 10), []);

    const load = async (start = 0, append = true) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await getDailyReels(date, start, 8);
            const items = res.data?.data?.items || [];
            setReels((prev) => append ? [...prev, ...items] : items);
            setSkip(start + items.length);
            setHasMore(Boolean(res.data?.data?.has_more));
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Không thể tải reels'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(0, false);
    }, []);

    useEffect(() => {
        if (!targetMediaId || !reels.length || !containerRef.current) return;
        const idx = reels.findIndex((r) => r.media_id === targetMediaId);
        if (idx >= 0) {
            setActiveIndex(idx);
            containerRef.current.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' });
        }
    }, [targetMediaId, reels.length]);

    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;
        const handler = () => {
            const idx = Math.round(root.scrollTop / window.innerHeight);
            setActiveIndex(idx);
            if (idx >= reels.length - 2 && hasMore && !loading) load(skip, true);
        };
        root.addEventListener('scroll', handler, { passive: true });
        return () => root.removeEventListener('scroll', handler);
    }, [reels.length, skip, hasMore, loading]);

    const handleLike = (mediaId) => trackReelAnalytics(mediaId, { action: 'like' });

    const handleShare = async (item) => {
        try {
            if (navigator.share) {
                await navigator.share({ title: 'DTU Reels', url: window.location.href });
            } else {
                await navigator.clipboard.writeText(window.location.href);
            }
            await trackReelAnalytics(item.media_id, { action: 'share' });
            toast.success('Đã chia sẻ');
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Không thể chia sẻ reel'));
        }
    };

    const handleWatch = async (mediaId, seconds) => {
        if (seconds <= 0.2) return;
        try {
            await trackReelView(mediaId, seconds);
            await trackReelAnalytics(mediaId, { action: 'watch', watch_time: seconds });
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Không thể ghi nhận lượt xem'));
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black text-white">
            <button onClick={() => navigate('/')} className="absolute z-10 top-3 left-3 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center cursor-pointer">
                <ChevronLeft />
            </button>
            <div ref={containerRef} className="h-full w-full overflow-y-auto snap-y snap-mandatory">
                {reels.map((item, idx) => (
                    <ReelItem
                        key={item.media_id}
                        item={item}
                        active={idx === activeIndex}
                        onLike={handleLike}
                        onShare={handleShare}
                        onWatch={handleWatch}
                        onSwipeLeft={() => navigate('/profile')}
                        onNearEnd={() => {
                            if (idx >= reels.length - 2 && hasMore && !loading) load(skip, true);
                        }}
                    />
                ))}
                {loading && <div className="h-20 flex items-center justify-center text-sm">Đang tải reels...</div>}
            </div>
        </div>
    );
}
