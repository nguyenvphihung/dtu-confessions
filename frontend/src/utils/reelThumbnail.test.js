import { describe, it, expect } from 'vitest';
import { isSupportedVideoFile, getReelThumbnailUrl } from './reelThumbnail';

describe('reelThumbnail utils', () => {
    it('nhận diện định dạng mp4 mov webm', () => {
        expect(isSupportedVideoFile('sample.mp4')).toBe(true);
        expect(isSupportedVideoFile('sample.MOV')).toBe(true);
        expect(isSupportedVideoFile('sample.webm')).toBe(true);
    });

    it('ưu tiên file_url gốc của video để trích xuất frame bằng trình duyệt', () => {
        const item = { file_name: 'sample.mp4', file_url: '/video.mp4', thumbnail_url: '/thumb.jpg' };
        expect(getReelThumbnailUrl(item)).toBe('/video.mp4');
    });

    it('fallback về file_url khi không có thumbnail_url', () => {
        const item = { file_name: 'clip.mov', file_url: '/clip.mov' };
        expect(getReelThumbnailUrl(item)).toBe('/clip.mov');
    });

    it('trả rỗng khi file không hợp lệ', () => {
        const item = { file_name: 'doc.pdf', file_url: '/doc.pdf' };
        expect(getReelThumbnailUrl(item)).toBe('');
    });
});
