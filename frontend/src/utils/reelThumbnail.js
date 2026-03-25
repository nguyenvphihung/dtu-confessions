const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.mkv'];

export function isSupportedVideoFile(fileName = '') {
    const lower = String(fileName || '').toLowerCase();
    return SUPPORTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function getReelThumbnailUrl(item) {
    if (!item) return '';
    
    // Prefer the backend-generated thumbnail (ffmpeg/cv2 frame extraction)
    if (item.thumbnail_url) return item.thumbnail_url;
    
    // Fallback: use native file URL with #t=0.1 (only works for same-origin/local files)
    if (isSupportedVideoFile(item.file_name) && item.file_url) {
        return item.file_url;
    }
    
    return '';
}
