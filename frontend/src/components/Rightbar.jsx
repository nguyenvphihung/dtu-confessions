import { NavLink, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

export function Rightbar() {
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside
            className="hidden lg:flex flex-col fixed right-0 top-0 h-screen w-16 xl:w-20 z-40 py-6 items-center justify-between"
            style={{
                background: isDark ? 'rgba(18, 18, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderLeft: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
            }}
        >
            {/* Top */}
            <div className="flex flex-col items-center gap-6 mt-2">
                <NotificationDropdown inRightbar={true} />
            </div>

            {/* Bottom */}
            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-xl transition-all duration-200 cursor-pointer"
                    style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
                >
                    {isDark ? <Sun size={22} /> : <Moon size={22} />}
                </button>

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `p-3 rounded-xl transition-all duration-200 ${isActive ? '' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                    }
                    style={({ isActive }) => isActive ? { color: '#E53E3E', background: isDark ? 'rgba(229, 62, 62, 0.15)' : 'rgba(229, 62, 62, 0.08)' } : {}}
                    title="Cài đặt"
                >
                    <SettingsIcon size={22} />
                </NavLink>

                {user && (
                    <button
                        onClick={handleLogout}
                        className="p-3 rounded-xl transition-all duration-200 cursor-pointer hover:text-red-500"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                        title="Đăng xuất"
                    >
                        <LogOut size={22} />
                    </button>
                )}
            </div>
        </aside>
    );
}
