const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.mkv'];

export function isSupportedVideoFile(fileName = '') {
    const lower = String(fileName || '').toLowerCase();
    return SUPPORTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function getReelThumbnailUrl(item) {
    if (!item) return '';
    if (item.thumbnail_url) return item.thumbnail_url;
    if (isSupportedVideoFile(item.file_name) && item.file_url) return item.file_url;
    return '';
}
