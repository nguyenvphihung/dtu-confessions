import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

export function PostSkeleton() {
    const { isDark } = useTheme();

    const bgColor = isDark ? '#1A1A24' : '#FFFFFF';
    const shimmerBase = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    const shimmerHighlight = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

    const shimmerVariants = {
        animate: {
            backgroundPosition: ['200% 0', '-200% 0'],
            transition: {
                duration: 2,
                ease: 'linear',
                repeat: Infinity,
            },
        },
    };

    const ShimmerElement = ({ className, style }) => (
        <motion.div
            variants={shimmerVariants}
            animate="animate"
            className={className}
            style={{
                ...style,
                background: `linear-gradient(90deg, ${shimmerBase} 25%, ${shimmerHighlight} 50%, ${shimmerBase} 75%)`,
                backgroundSize: '200% 100%',
                borderRadius: '8px',
            }}
        />
    );

    return (
        <div
            className="rounded-2xl p-4 mb-4"
            style={{
                background: bgColor,
                boxShadow: isDark
                    ? '0 2px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)'
                    : '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <ShimmerElement className="w-11 h-11 shrink-0 rounded-full" />
                <div className="flex flex-col gap-2 flex-1">
                    <ShimmerElement className="h-4 w-32" />
                    <ShimmerElement className="h-3 w-20" />
                </div>
                <ShimmerElement className="w-8 h-8 rounded-full ml-auto" />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2 mb-4">
                <ShimmerElement className="h-3.5 w-full" />
                <ShimmerElement className="h-3.5 w-[90%]" />
                <ShimmerElement className="h-3.5 w-[60%]" />
            </div>

            {/* Media Placeholder */}
            <ShimmerElement className="w-full h-[250px] mb-4 rounded-xl" />

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex gap-4">
                    <ShimmerElement className="h-6 w-16" />
                    <ShimmerElement className="h-6 w-16" />
                </div>
                <ShimmerElement className="h-6 w-16" />
            </div>
        </div>
    );
}
