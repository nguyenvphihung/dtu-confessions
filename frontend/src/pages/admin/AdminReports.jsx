import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import api, { getApiErrorMessage } from '../../api/axios';
import { toast } from 'react-toastify';
import { motion } from 'motion/react';
import { TrendingUp, Users, MessageSquare, Heart } from 'lucide-react';

export function AdminReports() {
    const { isDark } = useTheme();
    const [stats, setStats] = useState(null);
    const [topPosts, setTopPosts] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, topPostsRes, activeUsersRes] = await Promise.all([
                api.get('/stats/'),
                api.get('/stats/top-posts'),
                api.get('/stats/active-users')
            ]);
            setStats(statsRes.data);
            setTopPosts(topPostsRes.data);
            setActiveUsers(activeUsersRes.data);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Không thể tải dữ liệu báo cáo'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const chartColors = isDark 
        ? ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
        : ['#E53E3E', '#3182CE', '#38A169', '#D69E2E', '#805AD5'];

    if (loading) {
        return <div className="text-center py-20 opacity-50">Đang phân tích dữ liệu...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Báo cáo hệ thống</h2>
                <p className="text-sm opacity-60">Thống kê trực quan về hoạt động của cộng đồng.</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng bài viết', value: stats?.total_posts, icon: TrendingUp, color: '#EF4444' },
                    { label: 'Tổng thành viên', value: stats?.total_users, icon: Users, color: '#3B82F6' },
                    { label: 'Tổng bình luận', value: stats?.total_comments, icon: MessageSquare, color: '#10B981' },
                    { label: 'Bài viết hôm nay', value: stats?.posts_today, icon: Heart, color: '#F59E0B' },
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-2xl"
                        style={{ 
                            background: isDark ? '#1A1A24' : '#FFFFFF',
                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'
                        }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg" style={{ background: `${s.color}15`, color: s.color }}>
                                <s.icon size={18} />
                            </div>
                            <span className="text-xs font-semibold opacity-60 uppercase tracking-wider">{s.label}</span>
                        </div>
                        <div className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{s.value || 0}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Posts Chart */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl"
                    style={{ 
                        background: isDark ? '#1A1A24' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'
                    }}
                >
                    <h3 className="text-md font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-red-500" />
                        Top 5 Bài viết tương tác cao
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topPosts} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                                <XAxis 
                                    dataKey="id" 
                                    tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} 
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `#${val}`}
                                />
                                <YAxis tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        background: isDark ? '#1E1E2E' : '#FFF', 
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                                <Bar dataKey="like_count" name="Lượt thích" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="comment_count" name="Bình luận" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Active Users Chart */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl"
                    style={{ 
                        background: isDark ? '#1A1A24' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'
                    }}
                >
                    <h3 className="text-md font-semibold mb-6 flex items-center gap-2">
                        <Users size={18} className="text-blue-500" />
                        Top 5 Thành viên tích cực nhất
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activeUsers} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="display_name" 
                                    type="category" 
                                    tick={{ fontSize: 11, fontWeight: 500, fill: isDark ? '#94A3B8' : '#64748B' }} 
                                    width={100}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        background: isDark ? '#1E1E2E' : '#FFF', 
                                        border: 'none' 
                                    }}
                                />
                                <Bar dataKey="post_count" name="Số bài đăng" radius={[0, 4, 4, 0]}>
                                    {activeUsers.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
