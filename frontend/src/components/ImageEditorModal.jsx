import { useEffect, useMemo, useState } from 'react';
import { X, RotateCcw, RotateCw, Crop } from 'lucide-react';
import { toast } from 'react-toastify';

const RATIOS = [
    { value: 'original', label: 'Gốc' },
    { value: '1:1', label: '1:1' },
    { value: '4:5', label: '4:5' },
    { value: '16:9', label: '16:9' },
];

function ratioToNumber(ratio) {
    if (ratio === '1:1') return 1;
    if (ratio === '4:5') return 4 / 5;
    if (ratio === '16:9') return 16 / 9;
    return null;
}

export function ImageEditorModal({ open, file, onClose, onApply }) {
    const [rotation, setRotation] = useState(0);
    const [ratio, setRatio] = useState('original');
    const [processing, setProcessing] = useState(false);
    const sourceUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

    useEffect(() => {
        return () => {
            if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        };
    }, [sourceUrl]);

    useEffect(() => {
        if (!open) return;
        setRotation(0);
        setRatio('original');
    }, [open, file]);

    if (!open || !file) return null;

    const applyEdit = async () => {
        setProcessing(true);
        try {
            const img = await new Promise((resolve, reject) => {
                const i = new Image();
                i.onload = () => resolve(i);
                i.onerror = reject;
                i.src = sourceUrl;
            });

            const normalized = ((rotation % 360) + 360) % 360;
            const quarterTurn = normalized === 90 || normalized === 270;
            const rotatedW = quarterTurn ? img.height : img.width;
            const rotatedH = quarterTurn ? img.width : img.height;
            const ratioNumber = ratioToNumber(ratio);

            let cropW = rotatedW;
            let cropH = rotatedH;
            if (ratioNumber) {
                if (rotatedW / rotatedH > ratioNumber) {
                    cropH = rotatedH;
                    cropW = rotatedH * ratioNumber;
                } else {
                    cropW = rotatedW;
                    cropH = rotatedW / ratioNumber;
                }
            }

            const output = document.createElement('canvas');
            output.width = Math.max(1, Math.floor(cropW));
            output.height = Math.max(1, Math.floor(cropH));
            const outCtx = output.getContext('2d');

            const temp = document.createElement('canvas');
            temp.width = Math.floor(rotatedW);
            temp.height = Math.floor(rotatedH);
            const tempCtx = temp.getContext('2d');
            tempCtx.translate(temp.width / 2, temp.height / 2);
            tempCtx.rotate((normalized * Math.PI) / 180);
            tempCtx.drawImage(img, -img.width / 2, -img.height / 2);

            const sx = Math.floor((temp.width - output.width) / 2);
            const sy = Math.floor((temp.height - output.height) / 2);
            outCtx.drawImage(temp, sx, sy, output.width, output.height, 0, 0, output.width, output.height);

            const blob = await new Promise((resolve) => output.toBlob(resolve, file.type || 'image/jpeg', 0.92));
            if (!blob) {
                toast.error('Không thể chỉnh sửa ảnh');
                return;
            }
            const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
            const edited = new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: blob.type });
            onApply(edited);
            onClose();
        } catch {
            toast.error('Không thể xử lý ảnh');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[95] bg-black/80 flex items-center justify-center p-3" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl bg-[#11111B] text-white border border-white/10" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="text-sm font-semibold">Chỉnh sửa ảnh trước khi upload</div>
                    <button onClick={onClose} className="cursor-pointer text-white/80 hover:text-white">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    <img src={sourceUrl} alt="" className="w-full max-h-[52vh] object-contain rounded-xl bg-black/30" style={{ transform: `rotate(${rotation}deg)` }} />
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setRotation((v) => v - 90)} className="px-3 py-1.5 rounded bg-white/10 text-sm cursor-pointer flex items-center gap-1">
                            <RotateCcw size={14} /> Xoay trái
                        </button>
                        <button onClick={() => setRotation((v) => v + 90)} className="px-3 py-1.5 rounded bg-white/10 text-sm cursor-pointer flex items-center gap-1">
                            <RotateCw size={14} /> Xoay phải
                        </button>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-white/70 flex items-center gap-1"><Crop size={13} /> Tỷ lệ</span>
                            <select value={ratio} onChange={(e) => setRatio(e.target.value)} className="bg-black/30 rounded px-2 py-1 text-sm">
                                {RATIOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={applyEdit} disabled={processing} className="px-4 py-2 rounded bg-[#E53E3E] text-white disabled:opacity-50 cursor-pointer">
                            {processing ? 'Đang xử lý...' : 'Áp dụng'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
