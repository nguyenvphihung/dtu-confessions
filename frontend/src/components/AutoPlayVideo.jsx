import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function AutoPlayVideo({ media, onOpen }) {
    const wrapRef = useRef(null);
    const videoRef = useRef(null);
    const [inView, setInView] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(false);
    const [ready, setReady] = useState(false);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
                setInView(isVisible);
                if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
                    setShouldLoad(true);
                }
            },
            { threshold: [0.15, 0.3, 0.5, 0.7] }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (inView) {
            video.muted = muted;
            video.play().catch(() => {
            });
        } else {
            video.pause();
        }
    }, [inView, muted]);

    const toggleMute = (e) => {
        e.stopPropagation();
        const next = !muted;
        setMuted(next);
        if (videoRef.current) videoRef.current.muted = next;
    };

    return (
        <div ref={wrapRef} className="relative w-full cursor-pointer rounded-xl overflow-hidden" style={{ minHeight: ready ? 'auto' : '200px', background: 'rgba(15, 23, 42, 0.1)' }} onClick={() => onOpen(media)}>
            <video
                ref={videoRef}
                src={media.file_url}
                className={`w-full ${ready ? 'opacity-100' : 'opacity-0'}`}
                style={{ maxHeight: '320px', transition: 'opacity 0.3s' }}
                playsInline
                preload="metadata"
                muted
                loop
                onLoadedData={() => setReady(true)}
                onCanPlay={() => setReady(true)}
                onWaiting={() => setReady(false)}
                onStalled={() => setReady(false)}
            />
            {!ready && (
                <div className="absolute inset-0 flex items-center justify-center animate-pulse" style={{ background: 'rgba(15, 23, 42, 0.05)' }}>
                    <div className="w-7 h-7 border-2 border-slate-400/30 border-t-slate-500 rounded-full animate-spin" />
                </div>
            )}
            <button
                onClick={toggleMute}
                className="absolute right-3 bottom-3 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
            >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
        </div>
    );
}
