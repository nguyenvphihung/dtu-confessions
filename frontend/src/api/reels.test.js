import { describe, it, expect, vi } from 'vitest';

vi.mock('./axios', () => ({
    default: {
        get: vi.fn((url) => Promise.resolve({ data: url })),
        post: vi.fn((url, payload) => Promise.resolve({ data: { url, payload } })),
    },
}));

import api from './axios';
import { getDailyReels, trackReelView, trackReelAnalytics } from './reels';

describe('reels api', () => {
    it('build đúng query daily reels', async () => {
        await getDailyReels('2026-03-17', 10, 5);
        expect(api.get).toHaveBeenCalledWith('/reels/daily?date=2026-03-17&skip=10&limit=5');
    });

    it('track view gửi watch_time', async () => {
        await trackReelView(22, 3.4);
        expect(api.post).toHaveBeenCalledWith('/reels/22/view?watch_time=3.4');
    });

    it('track analytics payload', async () => {
        const payload = { action: 'like' };
        await trackReelAnalytics(12, payload);
        expect(api.post).toHaveBeenCalledWith('/reels/12/analytics', payload);
    });
});
