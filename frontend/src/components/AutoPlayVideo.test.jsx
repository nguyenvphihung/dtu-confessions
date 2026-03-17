import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutoPlayVideo } from './AutoPlayVideo';

describe('AutoPlayVideo', () => {
    beforeEach(() => {
        globalThis.IntersectionObserver = class {
            constructor(callback) {
                this.callback = callback;
            }
            observe() {
                this.callback([{ isIntersecting: true, intersectionRatio: 0.8 }]);
            }
            disconnect() {}
            unobserve() {}
        };
        Object.defineProperty(HTMLMediaElement.prototype, 'play', {
            configurable: true,
            value: vi.fn(() => Promise.resolve()),
        });
        Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
            configurable: true,
            value: vi.fn(),
        });
    });

    it('render video và mở modal callback khi click', () => {
        const onOpen = vi.fn();
        render(<AutoPlayVideo media={{ id: 1, file_url: '/v.mp4', file_name: 'v.mp4' }} onOpen={onOpen} />);
        const video = document.querySelector('video');
        expect(video).toBeInTheDocument();
        fireEvent.click(video);
        expect(onOpen).toHaveBeenCalled();
    });

    it('toggle mute button hoạt động', () => {
        render(<AutoPlayVideo media={{ id: 1, file_url: '/v.mp4', file_name: 'v.mp4' }} onOpen={() => {}} />);
        const btn = screen.getByRole('button');
        fireEvent.click(btn);
        const video = document.querySelector('video');
        expect(video.muted).toBe(false);
    });
});
