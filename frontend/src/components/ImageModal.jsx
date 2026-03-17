import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CommentSection } from './CommentSection';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

function normalizeUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_URL || '';
    return `${base}${url}`;
}

export default function ImageModal({ images = [], postId, initialIndex = 0, onClose = () => {} }) {
    const { isDark } = useTheme();
    const [index, setIndex] = useState(initialIndex);

    useEffect(() => {
        setIndex(initialIndex);
    }, [initialIndex]);

    const modalRef = useRef(null);
    // focus trap and keyboard
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
            if (e.key === 'ArrowRight') setIndex((i) => Math.min(images.length - 1, i + 1));
            if (e.key === 'Tab' && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        // prevent background scroll
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // focus first focusable element in modal
        setTimeout(() => {
            const focusable = modalRef.current?.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable && focusable.length) focusable[0].focus();
        }, 0);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [images.length, onClose]);

    if (!images || images.length === 0) return null;

    const prev = () => setIndex((i) => Math.max(0, i - 1));
    const next = () => setIndex((i) => Math.min(images.length - 1, i + 1));

    // preload next/prev images
    useEffect(() => {
        const nextIdx = Math.min(images.length - 1, index + 1);
        const prevIdx = Math.max(0, index - 1);
        const imgs = [];
        if (images[nextIdx]) { imgs.push(new Image()); imgs[0].src = normalizeUrl(images[nextIdx].file_url); }
        if (images[prevIdx]) { imgs.push(new Image()); imgs[imgs.length - 1].src = normalizeUrl(images[prevIdx].file_url); }
        return () => { imgs.forEach(i => { i.src = ''; }); };
    }, [index, images]);

    const overlay = (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: isDark ? 'rgba(2,6,23,0.75)' : 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div ref={modalRef} className="max-w-6xl w-full max-h-[90vh] bg-transparent p-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Image viewer">
                <div className={`flex rounded-xl overflow-hidden shadow-xl transition-all duration-200`} style={{ height: '80vh', background: isDark ? '#0b1220' : '#ffffff' }}>
                    {/* Left: Image */}
                    <div className="relative flex-1 flex items-center justify-center" style={{ background: isDark ? '#05060a' : '#f8fafc' }}>
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={index}
                                src={normalizeUrl(images[index].file_url)}
                                alt={images[index].file_name}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                                className="max-h-full max-w-full object-contain"
                            />
                        </AnimatePresence>

                        {/* Left arrow */}
                        {index > 0 && (
                            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/40">
                                <ChevronLeft />
                            </button>
                        )}

                        {/* Right arrow */}
                        {index < images.length - 1 && (
                            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/40">
                                <ChevronRight />
                            </button>
                        )}

                        {/* Close */}
                        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 p-2 rounded-full bg-black/30 text-white hover:bg-black/40">
                            <X />
                        </button>
                    </div>

                    {/* Right: Comments */}
                    <div className="w-96 flex flex-col" style={{ background: isDark ? '#071024' : '#f8fafc', borderLeft: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)' }}>
                        <div className="px-4 py-3 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.04)' }}>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold" style={{ color: isDark ? '#FF6B6B' : '#C53030' }}>Bình luận</h3>
                                    <div className="text-sm text-gray-500">{index + 1}/{images.length}</div>
                                </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <CommentSection postId={postId} isOpen={true} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const mount = document.getElementById('modal-root') || document.body;
    return createPortal(overlay, mount);
}
