import { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Swal from 'sweetalert2';
import { getUsers, changeUserRole, toggleBanUser } from '../../api/admin';
import { motion } from 'motion/react';
import { getApiErrorMessage } from '../../api/axios';
import { toast } from 'react-toastify';

export function AdminUsers() {
    const { isDark } = useTheme();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 20;

    const fetchUsers = async (skip = 0, searchQuery = search) => {
        setLoading(true);
        try {
            const res = await getUsers(skip, limit, searchQuery);
            const data = res.data.items || res.data;
            setUsers(data);
            setHasMore(data.length === limit);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải danh sách người dùng'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(0, '');
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        fetchUsers(0, search);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchUsers(newPage * limit, search);
    };

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const res = await Swal.fire({
            title: `Đổi vai trò thành "${newRole}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy',
        });
        if (!res.isConfirmed) return;
        try {
            await changeUserRole(userId, newRole);
            fetchUsers(page * limit, search);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể đổi vai trò'));
        }
    };

    const handleBanToggle = async (userId, isBanned) => {
        const action = isBanned ? 'bỏ cấm' : 'cấm';
        const res = await Swal.fire({
            title: `Bạn có chắc chắn muốn ${action} người dùng này?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy',
        });
        if (!res.isConfirmed) return;
        try {
            await toggleBanUser(userId, !isBanned);
            fetchUsers(page * limit, search);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể cấm hoặc bỏ cấm người dùng'));
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
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Quản lý người dùng</h2>
                <p className="text-sm opacity-60">Tìm kiếm và điều chỉnh quyền hạn thành viên.</p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm theo tên hoặc MSSV..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none"
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                            color: isDark ? '#F1F5F9' : '#1A1A2E',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.875rem',
                        }}
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-white cursor-pointer"
                    style={{
                        background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                    }}
                >
                    Tìm
                </button>
            </form>

            {loading ? (
                <div className="text-center py-8" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>Đang tải...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-8" style={{ color: isDark ? '#64748B' : '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    Không tìm thấy người dùng nào.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {users.map((u) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: users.indexOf(u) * 0.02, duration: 0.3 }}
                            whileHover={{ y: -2, boxShadow: isDark ? '0 6px 25px rgba(0,0,0,0.3)' : '0 6px 25px rgba(0,0,0,0.08)' }}
                            className="p-4 flex items-center justify-between gap-3"
                            style={cardStyle}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                    style={{ background: u.role === 'admin' ? 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' : 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)' }}
                                >
                                    {(u.display_name || u.student_id || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="truncate"
                                            style={{
                                                fontFamily: 'Poppins, sans-serif',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                color: isDark ? '#F1F5F9' : '#1A1A2E',
                                            }}
                                        >
                                            {u.display_name || u.student_id}
                                        </span>
                                        {u.role === 'admin' && (
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}
                                            >
                                                ADMIN
                                            </span>
                                        )}
                                        {u.is_banned && (
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}
                                            >
                                                BỊ CẤM
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#64748B' : '#94A3B8' }}>
                                        MSSV: {u.student_id}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleRoleChange(u.id, u.role)}
                                    title={u.role === 'admin' ? 'Hạ quyền' : 'Nâng quyền Admin'}
                                    className="p-2 rounded-lg transition-colors cursor-pointer"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                        color: u.role === 'admin' ? '#F59E0B' : isDark ? '#94A3B8' : '#64748B',
                                    }}
                                >
                                    {u.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                </button>
                                <button
                                    onClick={() => handleBanToggle(u.id, u.is_banned)}
                                    title={u.is_banned ? 'Bỏ cấm' : 'Cấm người dùng'}
                                    className="p-2 rounded-lg transition-colors cursor-pointer"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                        color: u.is_banned ? '#22C55E' : '#EF4444',
                                    }}
                                >
                                    {u.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    <div className="flex items-center justify-center gap-3 mt-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 0}
                            className="p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: isDark ? '#94A3B8' : '#64748B' }}>
                            Trang {page + 1}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={!hasMore}
                            className="p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
