const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.mkv'];

export function isSupportedVideoFile(fileName = '') {
    const lower = String(fileName || '').toLowerCase();
    return SUPPORTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function getReelThumbnailUrl(item) {
    if (!item) return '';
    
    // Prefer the backend-generated thumbnail (ffmpeg/cv2 frame extraction)
    if (item.thumbnail_url) {
        // If it's a relative path and we have an API URL defined, prepend it
        if (item.thumbnail_url.startsWith('/') && import.meta.env.VITE_API_URL) {
            // Ensure we don't double the '/api' part if VITE_API_URL includes it and thumbnail_url also has it
            const apiBase = import.meta.env.VITE_API_URL;
            if (apiBase.endsWith('/api') && item.thumbnail_url.startsWith('/api')) {
                return apiBase.replace(/\/api$/, '') + item.thumbnail_url;
            }
            return apiBase + item.thumbnail_url;
        }
        return item.thumbnail_url;
    }
    
    // Fallback: use native file URL with #t=0.1 (only works for same-origin/local files)
    if (isSupportedVideoFile(item.file_name) && item.file_url) {
        return item.file_url;
    }
    
    return '';
}

