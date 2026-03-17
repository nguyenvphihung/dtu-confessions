import { describe, it, expect } from 'vitest';
import { normalizeTrimRange, validateVideoOutput, pushHistory } from './videoEditor';

describe('videoEditor utils', () => {
    it('chuẩn hóa khoảng trim theo duration', () => {
        const range = normalizeTrimRange(-2, 20, 10);
        expect(range.start).toBe(0);
        expect(range.end).toBe(10);
    });

    it('đảm bảo end luôn lớn hơn start tối thiểu 0.1s', () => {
        const range = normalizeTrimRange(4.3, 4.3, 9);
        expect(range.end).toBe(4.4);
    });

    it('validate định dạng và dung lượng video', () => {
        const okFile = new File([new Uint8Array(10)], 'a.mp4', { type: 'video/mp4' });
        expect(validateVideoOutput(okFile).ok).toBe(true);
        const badFile = new File([new Uint8Array(10)], 'a.avi', { type: 'video/avi' });
        expect(validateVideoOutput(badFile).ok).toBe(false);
    });

    it('giới hạn history stack theo limit', () => {
        let stack = [];
        for (let i = 0; i < 5; i++) stack = pushHistory(stack, { i }, 3);
        expect(stack).toHaveLength(3);
        expect(stack[0].i).toBe(2);
        expect(stack[2].i).toBe(4);
    });
});
