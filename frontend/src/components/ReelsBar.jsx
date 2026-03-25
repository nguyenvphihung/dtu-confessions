import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { getDailyReels } from '../api/reels';
import { toast } from 'react-toastify';
import { getApiErrorMessage } from '../api/axios';
import { getReelThumbnailUrl, isSupportedVideoFile } from '../utils/reelThumbnail';

const ITEM_WIDTH = 120;

function ReelThumb({ item }) {
    const thumbUrl = getReelThumbnailUrl(item);

    if (!thumbUrl) {
        return <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(180deg, #334155 0%, #0F172A 100%)' }} />;
    }

    return (
        <img
            src={thumbUrl}
            alt={item.file_name || 'thumbnail'}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
        />
    );
}

export function ReelsBar({ isDark }) {
    const navigate = useNavigate();
    const listRef = useRef(null);
    const sentinelRef = useRef(null);
    const [items, setItems] = useState([]);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [scrollLeft, setScrollLeft] = useState(0);

    const key = useMemo(() => {
        const now = new Date();
        return `daily-reels-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    }, []);

    const load = async (start = 0, append = true) => {
        if (loading) return;
        setLoading(true);
        try {
            const now = new Date().toISOString().slice(0, 10);
            const res = await getDailyReels(now, start, 20);
            const data = res.data?.data?.items || [];
            setItems((prev) => {
                const next = append ? [...prev, ...data] : data;
                sessionStorage.setItem(key, JSON.stringify(next));
                return next;
            });
            setSkip(start + data.length);
            setHasMore(Boolean(res.data?.data?.has_more));
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Không thể tải reels'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cached = sessionStorage.getItem(key);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length) {
                    setItems(parsed);
                    setSkip(parsed.length);
                    return;
                }
            } catch (error) {
                toast.error(getApiErrorMessage(error, 'Cache reels không hợp lệ'));
            }
        }
        load(0, false);
    }, [key]);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                load(skip, true);
            }
        }, { root: listRef.current, threshold: 0.6 });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [skip, hasMore, loading]);

    const visible = useMemo(() => {
        const viewportWidth = listRef.current?.clientWidth || 1;
        const start = Math.max(0, Math.floor(scrollLeft / ITEM_WIDTH) - 2);
        const count = Math.ceil(viewportWidth / ITEM_WIDTH) + 6;
        return { start, end: start + count };
    }, [scrollLeft, items.length]);

    if (!items.length && !loading) return null;

    return (
        <div
            className="rounded-2xl p-3 mb-3"
            style={{
                background: isDark ? '#1A1A24' : '#FFFFFF',
                boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.25)' : '0 2px 20px rgba(0,0,0,0.06)',
            }}
        >
            <div className="text-sm font-semibold mb-2" style={{ color: isDark ? '#F1F5F9' : '#1A1A2E' }}>
                Reels hôm nay
            </div>
            <div
                ref={listRef}
                className="overflow-x-auto scrollbar-thin"
                onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
            >
                <div className="relative h-[160px]" style={{ width: Math.max(items.length, 1) * ITEM_WIDTH }}>
                    {items.slice(visible.start, visible.end).map((item, index) => {
                        const pos = visible.start + index;
                        return (
                            <button
                                key={item.media_id}
                                onClick={() => navigate(`/reels?media=${item.media_id}`)}
                                className="absolute top-0 w-[108px] h-[152px] rounded-xl overflow-hidden cursor-pointer"
                                style={{ left: pos * ITEM_WIDTH, background: '#000' }}
                            >
                                <ReelThumb item={item} />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2 text-left text-white z-10">
                                    <div className="text-xs line-clamp-1">{item.author?.display_name || item.author?.student_id || 'Ẩn danh'}</div>
                                    <div className="text-[10px]">{item.view_count || 0} views</div>
                                </div>
                                <div className="absolute top-2 right-2 text-white z-10">
                                    <Play size={13} />
                                </div>
                            </button>
                        );
                    })}
                    <div ref={sentinelRef} className="absolute top-0 h-full w-2" style={{ left: items.length * ITEM_WIDTH - 2 }} />
                </div>
            </div>
        </div>
    );
}
