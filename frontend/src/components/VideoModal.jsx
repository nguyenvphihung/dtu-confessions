import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LazyCommentSection = lazy(() =>
    import('./CommentSection').then((mod) => ({ default: mod.CommentSection }))
);

export function VideoModal({ open, source, onClose }) {
    const { isDark } = useTheme();
    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [rate, setRate] = useState(1);

    useEffect(() => {
        if (!open || !videoRef.current) return;
        const video = videoRef.current;
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        return () => {
            video.pause();
            setPlaying(false);
        };
    }, [open, source]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open || !source) return null;

    const togglePlay = async () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            await video.play();
            setPlaying(true);
        } else {
            video.pause();
            setPlaying(false);
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setMuted(video.muted);
    };

    const requestFullscreen = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.requestFullscreen) video.requestFullscreen();
    };

    const handleRate = (newRate) => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = newRate;
        setRate(newRate);
    };

    const content = (
        <div className="fixed inset-0 z-[90] bg-black/85 flex items-center justify-center p-3" onClick={onClose}>
            <div className="w-full max-w-6xl h-[88vh] bg-[#0B0B12] rounded-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-white text-sm">{source.file_name || 'Video preview'}</span>
                    <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
                <div className="flex-1 min-h-0 flex flex-col lg:w-3/5">
                    <div className="flex-1 min-h-0 overflow-hidden bg-black">
                        <video
                            ref={videoRef}
                            src={source.file_url}
                            className="w-full h-full object-contain"
                            controls
                            playsInline
                            onPlay={() => setPlaying(true)}
                            onPause={() => setPlaying(false)}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <button onClick={togglePlay} className="text-white/90 hover:text-white cursor-pointer">
                                {playing ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                            <button onClick={toggleMute} className="text-white/90 hover:text-white cursor-pointer">
                                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <button onClick={requestFullscreen} className="text-white/90 hover:text-white cursor-pointer">
                                <Maximize2 size={18} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1">
                            {[0.5, 1, 1.25, 1.5, 2].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => handleRate(v)}
                                    className="px-2 py-1 rounded text-xs cursor-pointer"
                                    style={{ background: rate === v ? '#E53E3E' : 'rgba(255,255,255,0.12)', color: '#fff' }}
                                >
                                    {v}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div
                    className="lg:w-2/5 border-t lg:border-t-0 lg:border-l border-white/10 min-h-0 overflow-y-auto"
                    style={{ background: isDark ? '#12121B' : '#FFFFFF' }}
                >
                    <Suspense fallback={<div className="p-4 text-sm text-white/70">Đang tải bình luận...</div>}>
                        <LazyCommentSection postId={source.post_id} isOpen />
                    </Suspense>
                </div>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
