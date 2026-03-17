import api from './axios';

export const getDailyReels = (date, skip = 0, limit = 12) => {
    const q = date ? `?date=${encodeURIComponent(date)}&skip=${skip}&limit=${limit}` : `?skip=${skip}&limit=${limit}`;
    return api.get(`/reels/daily${q}`);
};

export const trackReelView = (mediaId, watchTime = 0) => {
    return api.post(`/reels/${mediaId}/view?watch_time=${watchTime}`);
};

export const trackReelAnalytics = (mediaId, payload) => {
    return api.post(`/reels/${mediaId}/analytics`, payload);
};
