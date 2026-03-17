import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function AutoPlayVideo({ media, onOpen }) {
    const wrapRef = useRef(null);
    const videoRef = useRef(null);
    const [inView, setInView] = useState(false);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.5),
            { threshold: [0.3, 0.5, 0.7] }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (inView) {
            video.muted = muted;
            video.play().catch(() => {});
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
        <div ref={wrapRef} className="relative w-full cursor-pointer" onClick={() => onOpen(media)}>
            <video
                ref={videoRef}
                src={media.file_url}
                className="w-full rounded-xl"
                style={{ maxHeight: '320px' }}
                playsInline
                preload="metadata"
                muted
                loop
            />
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
