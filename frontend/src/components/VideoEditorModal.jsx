import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Scissors, Crop, RotateCcw, RotateCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { normalizeTrimRange, pushHistory, validateVideoOutput } from '../utils/videoEditor';

const PRESETS = [
    { value: '1:1', label: '1:1' },
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: 'custom', label: 'Custom' },
];

const ffmpegState = {
    ffmpeg: null,
    fetchFile: null,
    loading: null,
};

async function loadFFmpeg() {
    if (ffmpegState.ffmpeg && ffmpegState.fetchFile) return ffmpegState;
    if (!ffmpegState.loading) {
        ffmpegState.loading = (async () => {
            const [{ FFmpeg }, { fetchFile }] = await Promise.all([
                import('@ffmpeg/ffmpeg'),
                import('@ffmpeg/util'),
            ]);
            const ffmpeg = new FFmpeg();
            await ffmpeg.load();
            ffmpegState.ffmpeg = ffmpeg;
            ffmpegState.fetchFile = fetchFile;
            return ffmpegState;
        })();
    }
    return ffmpegState.loading;
}

function buildCropFilter(preset, customW, customH) {
    if (preset === '1:1') return "crop='min(iw,ih)':'min(iw,ih)'";
    if (preset === '16:9') return "crop='if(gte(iw/ih,16/9),ih*16/9,iw)':'if(gte(iw/ih,16/9),ih,iw*9/16)'";
    if (preset === '9:16') return "crop='if(gte(iw/ih,9/16),ih*9/16,iw)':'if(gte(iw/ih,9/16),ih,iw*16/9)'";
    const w = Math.max(1, Number(customW || 0));
    const h = Math.max(1, Number(customH || 0));
    if (!w || !h) return '';
    return `crop='if(gte(iw/ih,${w}/${h}),ih*${w}/${h},iw)':'if(gte(iw/ih,${w}/${h}),ih,iw*${h}/${w})'`;
}

export function VideoEditorModal({ open, file, onClose, onApply }) {
    const videoRef = useRef(null);
    const [duration, setDuration] = useState(0);
    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);
    const [preset, setPreset] = useState('16:9');
    const [customW, setCustomW] = useState(1);
    const [customH, setCustomH] = useState(1);
    const [format, setFormat] = useState('mp4');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [history, setHistory] = useState([]);
    const [redo, setRedo] = useState([]);

    const sourceUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

    useEffect(() => {
        return () => {
            if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        };
    }, [sourceUrl]);

    useEffect(() => {
        if (!open || !file) return;
        setDuration(0);
        setStart(0);
        setEnd(0);
        setPreset('16:9');
        setCustomW(1);
        setCustomH(1);
        setFormat('mp4');
        setProgress(0);
        setHistory([]);
        setRedo([]);
    }, [open, file]);

    useEffect(() => {
        if (!open || !videoRef.current) return;
        const video = videoRef.current;
        const onMeta = () => {
            setDuration(video.duration || 0);
            setEnd(video.duration || 0);
        };
        video.addEventListener('loadedmetadata', onMeta);
        return () => video.removeEventListener('loadedmetadata', onMeta);
    }, [open, sourceUrl]);

    useEffect(() => {
        if (!open || !videoRef.current) return;
        const video = videoRef.current;
        let raf = 0;
        const loop = () => {
            if (video.currentTime >= end && end > start) {
                video.currentTime = start;
            }
            raf = requestAnimationFrame(loop);
        };
        if (end > start) raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [open, start, end]);

    if (!open || !file) return null;

    const snapshot = () => ({ start, end, preset, customW, customH, format });

    const pushCurrent = () => {
        setHistory((prev) => pushHistory(prev, snapshot()));
        setRedo([]);
    };

    const handleUndo = () => {
        if (!history.length) return;
        const prev = history[history.length - 1];
        setRedo((stack) => [...stack, snapshot()]);
        setHistory((stack) => stack.slice(0, -1));
        setStart(prev.start);
        setEnd(prev.end);
        setPreset(prev.preset);
        setCustomW(prev.customW);
        setCustomH(prev.customH);
        setFormat(prev.format);
    };

    const handleRedo = () => {
        if (!redo.length) return;
        const next = redo[redo.length - 1];
        setHistory((stack) => pushHistory(stack, snapshot()));
        setRedo((stack) => stack.slice(0, -1));
        setStart(next.start);
        setEnd(next.end);
        setPreset(next.preset);
        setCustomW(next.customW);
        setCustomH(next.customH);
        setFormat(next.format);
    };

    const processVideo = async () => {
        const range = normalizeTrimRange(start, end, duration);
        if (range.end - range.start < 0.1) {
            toast.error('Khoảng trim không hợp lệ');
            return;
        }
        setProcessing(true);
        setProgress(0);
        try {
            const { ffmpeg, fetchFile } = await loadFFmpeg();
            ffmpeg.on('progress', ({ progress: p }) => setProgress(Math.max(1, Math.round((p || 0) * 100))));
            const inName = `input-${Date.now()}.${file.type.includes('webm') ? 'webm' : 'mp4'}`;
            const outName = `output-${Date.now()}.${format}`;
            await ffmpeg.writeFile(inName, await fetchFile(file));
            const args = ['-ss', String(range.start), '-to', String(range.end), '-i', inName];
            const cropFilter = buildCropFilter(preset, customW, customH);
            if (cropFilter) args.push('-vf', cropFilter);
            if (format === 'webm') args.push('-f', 'webm');
            else args.push('-f', 'mp4');
            args.push('-preset', 'ultrafast', '-crf', '30', outName);
            await ffmpeg.exec(args);
            const data = await ffmpeg.readFile(outName);
            const mime = format === 'webm' ? 'video/webm' : 'video/mp4';
            const blob = new Blob([data.buffer], { type: mime });
            const editedFile = new File([blob], file.name.replace(/\.[^.]+$/, `.${format}`), { type: mime });
            const check = validateVideoOutput(editedFile, 120);
            if (!check.ok) {
                toast.error(check.message);
                return;
            }
            setProgress(100);
            onApply(editedFile);
            onClose();
        } catch {
            toast.error('Không thể xử lý video');
        } finally {
            setProcessing(false);
        }
    };

    const onChangeStart = (value) => {
        pushCurrent();
        const next = normalizeTrimRange(value, end || duration, duration);
        setStart(next.start);
        setEnd(next.end);
    };

    const onChangeEnd = (value) => {
        pushCurrent();
        const next = normalizeTrimRange(start, value, duration);
        setStart(next.start);
        setEnd(next.end);
    };

    return (
        <div className="fixed inset-0 z-[95] bg-black/80 flex items-center justify-center p-3" onClick={onClose}>
            <div className="w-full max-w-3xl rounded-2xl bg-[#11111B] text-white border border-white/10" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="text-sm font-semibold">Chỉnh sửa video</div>
                    <button onClick={onClose} className="cursor-pointer text-white/80 hover:text-white">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    <video ref={videoRef} src={sourceUrl} className="w-full rounded-xl max-h-[45vh]" controls preload="metadata" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl bg-white/5 p-3">
                            <div className="text-xs mb-2 flex items-center gap-2"><Scissors size={14} /> Trim</div>
                            <div className="text-xs mb-1">Bắt đầu: {start.toFixed(1)}s</div>
                            <input type="range" min={0} max={duration || 0} step={0.1} value={start} onChange={(e) => onChangeStart(Number(e.target.value))} className="w-full" />
                            <div className="text-xs mb-1 mt-2">Kết thúc: {end.toFixed(1)}s</div>
                            <input type="range" min={0} max={duration || 0} step={0.1} value={end} onChange={(e) => onChangeEnd(Number(e.target.value))} className="w-full" />
                        </div>
                        <div className="rounded-xl bg-white/5 p-3">
                            <div className="text-xs mb-2 flex items-center gap-2"><Crop size={14} /> Crop</div>
                            <select
                                value={preset}
                                onChange={(e) => {
                                    pushCurrent();
                                    setPreset(e.target.value);
                                }}
                                className="w-full bg-black/30 rounded px-2 py-1 text-sm"
                            >
                                {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            {preset === 'custom' && (
                                <div className="flex gap-2 mt-2">
                                    <input type="number" min={1} value={customW} onChange={(e) => setCustomW(Number(e.target.value || 1))} className="w-full bg-black/30 rounded px-2 py-1 text-sm" />
                                    <input type="number" min={1} value={customH} onChange={(e) => setCustomH(Number(e.target.value || 1))} className="w-full bg-black/30 rounded px-2 py-1 text-sm" />
                                </div>
                            )}
                            <div className="mt-3">
                                <div className="text-xs mb-1">Output format</div>
                                <select
                                    value={format}
                                    onChange={(e) => {
                                        pushCurrent();
                                        setFormat(e.target.value);
                                    }}
                                    className="w-full bg-black/30 rounded px-2 py-1 text-sm"
                                >
                                    <option value="mp4">H.264 / MP4</option>
                                    <option value="webm">WebM</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={handleUndo} disabled={!history.length} className="px-3 py-1.5 rounded bg-white/10 disabled:opacity-40 cursor-pointer flex items-center gap-1">
                                <RotateCcw size={14} /> Undo
                            </button>
                            <button onClick={handleRedo} disabled={!redo.length} className="px-3 py-1.5 rounded bg-white/10 disabled:opacity-40 cursor-pointer flex items-center gap-1">
                                <RotateCw size={14} /> Redo
                            </button>
                        </div>
                        <button onClick={processVideo} disabled={processing} className="px-4 py-2 rounded bg-[#E53E3E] text-white disabled:opacity-50 cursor-pointer">
                            {processing ? 'Đang xử lý...' : 'Áp dụng'}
                        </button>
                    </div>
                    {processing && (
                        <div className="w-full h-2 rounded bg-white/10 overflow-hidden">
                            <div className="h-full bg-[#E53E3E]" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
