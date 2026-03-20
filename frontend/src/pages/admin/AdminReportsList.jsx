import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getReports, resolveReport } from '../../api/admin';
import { getApiErrorMessage } from '../../api/axios';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import { Flag, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const REASON_LABELS = {
    spam: 'Spam / Quảng cáo',
    violence: 'Bạo lực / Đe dọa',
    harassment: 'Quấy rối / Công kích',
    sensitive: 'Nội dung nhạy cảm',
    misinformation: 'Thông tin sai lệch',
    other: 'Khác',
};

const STATUS_COLORS = {
    pending: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', label: 'Chờ xử lý' },
    resolved: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', label: 'Đã xử lý' },
    dismissed: { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748B', label: 'Đã bỏ qua' },
};

export function AdminReportsList() {
    const { isDark } = useTheme();
    const [reports, setReports] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReports(0, 50, filterStatus);
            setReports(res.data.items || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải danh sách báo cáo'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filterStatus]);

    const handleResolve = async (reportId, action) => {
        try {
            await resolveReport(reportId, action);
            toast.success(action === 'resolved' ? 'Đã xử lý báo cáo' : 'Đã bỏ qua báo cáo');
            setReports(prev => prev.filter(r => r.id !== reportId));
            setTotal(prev => Math.max(0, prev - 1));
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể xử lý báo cáo'));
        }
    };

    const cardStyle = {
        background: isDark ? '#1A1A24' : '#FFFFFF',
        borderRadius: '16px',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <Flag size={20} className="inline mr-2" style={{ color: '#EF4444' }} />
                    Báo cáo vi phạm
                </h2>
                <p className="text-sm opacity-60">{total} báo cáo {filterStatus === 'pending' ? 'đang chờ xử lý' : ''}</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
                {['pending', 'resolved', 'dismissed'].map(s => {
                    const sc = STATUS_COLORS[s];
                    const isActive = filterStatus === s;
                    return (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                            style={{
                                background: isActive ? sc.bg : 'transparent',
                                color: isActive ? sc.text : isDark ? '#64748B' : '#94A3B8',
                                border: isActive ? `1px solid ${sc.text}30` : isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            {sc.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C53030', borderTopColor: 'transparent' }} />
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-16" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                    <AlertTriangle size={48} className="mx-auto mb-4 opacity-30" />
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>Không có báo cáo nào</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {reports.map((report, idx) => {
                        const sc = STATUS_COLORS[report.status] || STATUS_COLORS.pending;
                        return (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                style={cardStyle}
                                className="p-4 sm:p-5"
                            >
                                {/* Metadata */}
                                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: sc.bg, color: sc.text }}>
                                            {sc.label}
                                        </span>
                                        <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{
                                            background: report.target_type === 'post' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                                            color: report.target_type === 'post' ? '#3B82F6' : '#A855F7',
                                        }}>
                                            {report.target_type === 'post' ? 'Bài viết' : 'Bình luận'} #{report.target_id}
                                        </span>
                                        <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{
                                            background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444'
                                        }}>
                                            {REASON_LABELS[report.reason] || report.reason}
                                        </span>
                                    </div>
                                    <span className="text-xs" style={{ color: isDark ? '#475569' : '#94A3B8' }}>
                                        {new Date(report.created_at).toLocaleString('vi-VN')}
                                    </span>
                                </div>

                                {/* Reporter */}
                                <div className="text-xs mb-2" style={{ color: isDark ? '#94A3B8' : '#64748B', fontFamily: 'Inter, sans-serif' }}>
                                    Người báo cáo: <strong>{report.reporter?.display_name || report.reporter?.student_id || 'N/A'}</strong>
                                </div>

                                {/* Target content preview */}
                                {report.target_content && (
                                    <div className="p-3 rounded-xl mb-3" style={{
                                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
                                    }}>
                                        {report.target_author && (
                                            <div className="text-xs font-semibold mb-1" style={{ color: isDark ? '#CBD5E1' : '#374151' }}>
                                                {report.target_author}:
                                            </div>
                                        )}
                                        <p className="text-sm" style={{ color: isDark ? '#94A3B8' : '#4B5563', wordBreak: 'break-word', lineHeight: 1.5 }}>
                                            {report.target_content}
                                        </p>
                                    </div>
                                )}

                                {report.description && (
                                    <p className="text-xs mb-3 italic" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                                        "{report.description}"
                                    </p>
                                )}

                                {/* Actions */}
                                {report.status === 'pending' && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleResolve(report.id, 'resolved')}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl cursor-pointer text-xs font-semibold"
                                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
                                        >
                                            <CheckCircle size={14} /> Xử lý
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleResolve(report.id, 'dismissed')}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl cursor-pointer text-xs font-semibold"
                                            style={{ background: isDark ? 'rgba(100,116,139,0.15)' : 'rgba(100,116,139,0.08)', color: '#64748B' }}
                                        >
                                            <XCircle size={14} /> Bỏ qua
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
