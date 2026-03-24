const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.mkv'];

export function isSupportedVideoFile(fileName = '') {
    const lower = String(fileName || '').toLowerCase();
    return SUPPORTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function getReelThumbnailUrl(item) {
    if (!item) return '';
    
    // Always use the native file URL for videos so the browser can extract the `#t=0.5` frame directly.
    // This bypasses the backend's dummy SVG fallback if ffmpeg is missing.
    if (isSupportedVideoFile(item.file_name) && item.file_url) {
        return item.file_url;
    }
    
    if (item.thumbnail_url) return item.thumbnail_url;
    
    return '';
}
