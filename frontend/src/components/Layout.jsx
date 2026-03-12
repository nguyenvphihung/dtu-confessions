import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { useTheme } from '../context/ThemeContext';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AnimatedPage } from './AnimatedPage';

export function Layout() {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            if (searchTerm.trim()) navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
            else navigate('/');
            setSearchOpen(false);
        }
    };

    return (
        <div
            className="min-h-screen"
            style={{
                background: isDark ? '#0F0F13' : '#F0F2F8',
                fontFamily: 'Inter, sans-serif',
                transition: 'background 0.3s ease',
            }}
        >
            <Sidebar />

            {/* Mobile Top Bar */}
            <header
                className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14"
                style={{
                    background: isDark ? 'rgba(18, 18, 28, 0.97)' : 'rgba(255, 255, 255, 0.97)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
                }}
            >
                {searchOpen ? (
                    <input
                        autoFocus
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearch}
                        onBlur={() => { setSearchOpen(false); }}
                        placeholder="Tìm kiếm confession..."
                        className="flex-1 bg-transparent outline-none"
                        style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.9rem',
                            color: isDark ? '#F1F5F9' : '#1A1A2E',
                        }}
                    />
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <img src="/dtu_logo.png" alt="DTU" className="w-8 h-8 object-cover rounded-lg" />
                            <span style={{
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: '#E53E3E',
                            }}>DTU Confession</span>
                        </div>
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-2 rounded-xl cursor-pointer"
                            style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                        >
                            <Search size={20} />
                        </button>
                    </>
                )}
            </header>

            {/* Content */}
            <div className="lg:ml-64 flex justify-center pt-14 lg:pt-0">
                <div className="w-full max-w-5xl xl:max-w-6xl flex gap-4 px-3 sm:px-4 py-4 lg:py-6 xl:px-6">
                    <main className="flex-1 min-w-0 max-w-2xl pb-24 lg:pb-6">
                        <AnimatePresence mode="wait">
                            <AnimatedPage key={location.pathname}>
                                <Outlet />
                            </AnimatedPage>
                        </AnimatePresence>
                    </main>

                    <aside className="hidden xl:block w-80 flex-shrink-0">
                        <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin">
                            <RightPanel />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
