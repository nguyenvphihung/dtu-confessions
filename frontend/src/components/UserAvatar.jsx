import React from 'react';
import { UserCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const UserAvatar = React.memo(({ 
    user, 
    isAnonymous = false, 
    className = "", 
    sizeClasses = "w-11 h-11",
    fontSize = "0.9rem",
    onClick,
    children,
    style = {}
}) => {
    const { isDark } = useTheme();

    if (isAnonymous) {
        return (
            <div
                onClick={onClick}
                className={`relative flex-shrink-0 flex items-center justify-center rounded-full ${sizeClasses} ${className}`}
                style={{ 
                    ...style,
                    background: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                    cursor: onClick ? 'pointer' : 'default'
                }}
            >
                <UserCircle size={parseInt(sizeClasses.match(/\d+/)?.[0] || 11) * 2.5} style={{ color: isDark ? '#64748B' : '#94A3B8' }} />
                {children}
            </div>
        );
    }

    if (user?.avatar_url) {
        return (
            <div
                onClick={onClick}
                className={`relative flex-shrink-0 rounded-full overflow-hidden ${sizeClasses} ${className}`}
                style={{
                    ...style,
                    cursor: onClick ? 'pointer' : 'default'
                }}
            >
                <img 
                    src={user.avatar_url} 
                    alt={user.display_name || 'User Avatar'} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                {children}
            </div>
        );
    }

    const displayName = user?.display_name || user?.student_id || 'U';

    return (
        <div
            onClick={onClick}
            className={`relative flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold ${sizeClasses} ${className}`}
            style={{
                ...style,
                background: 'linear-gradient(135deg, #C53030 0%, #E53E3E 100%)',
                fontSize: fontSize,
                cursor: onClick ? 'pointer' : 'default'
            }}
        >
            {displayName.charAt(0).toUpperCase()}
            {children}
        </div>
    );
});
