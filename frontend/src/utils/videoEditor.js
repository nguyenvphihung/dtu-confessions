export function normalizeTrimRange(start, end, duration) {
    const safeDuration = Math.max(0, Number(duration || 0));
    const s = Math.max(0, Math.min(Number(start || 0), safeDuration));
    const e = Math.max(s + 0.1, Math.min(Number(end || safeDuration), safeDuration));
    return {
        start: Number(s.toFixed(1)),
        end: Number(e.toFixed(1)),
    };
}

export function validateVideoOutput(file, maxSizeMb = 120) {
    if (!file) return { ok: false, message: 'File không hợp lệ' };
    const mime = file.type || '';
    const supported = mime.startsWith('video/mp4') || mime.startsWith('video/webm');
    if (!supported) return { ok: false, message: 'Định dạng video chưa hỗ trợ' };
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) return { ok: false, message: 'Video vượt quá dung lượng cho phép' };
    return { ok: true, message: '' };
}

export function pushHistory(stack, state, limit = 20) {
    const next = [...stack, state];
    if (next.length <= limit) return next;
    return next.slice(next.length - limit);
}
