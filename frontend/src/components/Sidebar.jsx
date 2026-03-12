import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, User, Sun, Moon, PenSquare, LogOut, ShieldCheck } from 'lucide-react';
import dtuLogo from '../assets/dtu_logo.png';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CreatePostModal } from './CreatePostModal';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
    { to: '/', icon: Home, label: 'Trang chủ' },
    { to: '/profile', icon: User, label: 'Trang cá nhân' },
];

const adminNavItem = { to: '/admin', icon: ShieldCheck, label: 'Quản lý' };

export function Sidebar() {
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const [showCreate, setShowCreate] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 z-30 px-4 py-6 justify-between"
                style={{
                    background: isDark ? 'rgba(18, 18, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRight: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
                }}
            >
                <div>
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 px-2 mb-8">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                            <img
                                src={dtuLogo}
                                alt="DTU Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span
                            className="text-xl"
                            style={{
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 700,
                                color: '#E53E3E',
                            }}
                        >
                            DTU Confession
                        </span>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex flex-col gap-1">
                        {[...navItems, ...(user?.role === 'admin' ? [adminNavItem] : [])].map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                        ? ''
                                        : isDark
                                            ? 'text-gray-400 hover:text-white hover:bg-white/5'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                                    }`
                                }
                                style={({ isActive }) =>
                                    isActive
                                        ? {
                                            background: isDark ? 'rgba(229, 62, 62, 0.15)' : 'rgba(229, 62, 62, 0.08)',
                                            color: '#E53E3E',
                                        }
                                        : {}
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon size={20} />
                                        <span
                                            style={{
                                                fontFamily: 'Poppins, sans-serif',
                                                fontWeight: isActive ? 600 : 500,
                                                fontSize: '0.925rem',
                                            }}
                                        >
                                            {label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Create Post Button */}
                    <motion.button
                        onClick={() => setShowCreate(true)}
                        whileHover={{ scale: 1.03, boxShadow: '0 6px 25px rgba(229, 62, 62, 0.45)' }}
                        whileTap={{ scale: 0.96 }}
                        className="mt-5 w-full py-3 rounded-xl flex items-center justify-center gap-2 text-white cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)',
                            boxShadow: '0 4px 20px rgba(229, 62, 62, 0.35)',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.925rem',
                        }}
                    >
                        <PenSquare size={18} />
                        Viết Confession
                    </motion.button>
                </div>

                {/* Bottom */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                        style={{
                            color: isDark ? '#94A3B8' : '#64748B',
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                        }}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '0.925rem' }}>
                            {isDark ? 'Sáng' : 'Tối'}
                        </span>
                    </button>

                    {user && (
                        <div
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                            style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(79, 142, 247, 0.06)' }}
                        >
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                style={{ background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)' }}
                            >
                                {(user.display_name || user.student_id).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div
                                    className="truncate"
                                    style={{
                                        fontFamily: 'Poppins, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        color: isDark ? '#F1F5F9' : '#1A1A2E',
                                    }}
                                >
                                    {user.display_name || user.student_id}
                                </div>
                                <div className="truncate" style={{ fontSize: '0.75rem', color: isDark ? '#64748B' : '#94A3B8' }}>
                                    {user.student_id}
                                </div>
                            </div>
                            <button onClick={handleLogout} className="cursor-pointer" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <nav
                className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-3"
                style={{
                    background: isDark ? 'rgba(18, 18, 28, 0.97)' : 'rgba(255, 255, 255, 0.97)',
                    backdropFilter: 'blur(20px)',
                    borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
                }}
            >
                {[
                    { to: '/', icon: Home },
                    { to: '/profile', icon: User },
                    ...(user?.role === 'admin' ? [{ to: '/admin', icon: ShieldCheck }] : []),
                ].map(({ to, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `p-2.5 rounded-xl transition-all duration-200 ${isActive ? '' : isDark ? 'text-gray-500' : 'text-gray-400'}`
                        }
                        style={({ isActive }) =>
                            isActive
                                ? { background: isDark ? 'rgba(229, 62, 62, 0.15)' : 'rgba(229, 62, 62, 0.08)', color: '#E53E3E' }
                                : {}
                        }
                    >
                        <Icon size={22} />
                    </NavLink>
                ))}
                <motion.button
                    onClick={() => setShowCreate(true)}
                    whileTap={{ scale: 0.85 }}
                    className="p-2.5 rounded-xl text-white cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #E53E3E 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(229, 62, 62, 0.35)' }}
                >
                    <PenSquare size={22} />
                </motion.button>
            </nav>

            <CreatePostModal open={showCreate} onClose={() => setShowCreate(false)} />
        </>
    );
}
