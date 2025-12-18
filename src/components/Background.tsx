'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BackgroundProps {
    activeCategory: string;
}

const CATEGORY_COLORS: Record<string, string[]> = {
    all: ['#a855f7', '#3b82f6', '#ec4899'],
    crypto: ['#06b6d4', '#3b82f6', '#0891b2'],
    politics: ['#ef4444', '#3b82f6', '#991b1b'],
    sports: ['#f59e0b', '#ea580c', '#d97706'],
    esports: ['#ec4899', '#db2777', '#be185d'],
    news: ['#10b981', '#059669', '#047857'],
};

export const Background = ({ activeCategory }: BackgroundProps) => {
    const [mounted, setMounted] = useState(false);
    const colors = CATEGORY_COLORS[activeCategory.toLowerCase()] || CATEGORY_COLORS.all;

    // Mouse Tracking for Parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

    useEffect(() => {
        setMounted(true);
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const x = (clientX / window.innerWidth - 0.5) * 50;
            const y = (clientY / window.innerHeight - 0.5) * 50;
            mouseX.set(x);
            mouseY.set(y);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    if (!mounted) return null;

    return (
        <div className="mesh-gradient">
            {/* Primary Glow */}
            <motion.div
                animate={{
                    backgroundColor: colors[0],
                    x: springX.get() * -1,
                    y: springY.get() * -1,
                }}
                className="mesh-sphere w-[800px] h-[800px] -top-1/4 -left-1/4"
            />

            {/* Secondary Glow */}
            <motion.div
                animate={{
                    backgroundColor: colors[1],
                    x: springX.get() * 0.5,
                    y: springY.get() * 0.5,
                }}
                className="mesh-sphere w-[600px] h-[600px] top-1/4 -right-1/4 opacity-10"
            />

            {/* Accent Glow */}
            <motion.div
                animate={{
                    backgroundColor: colors[2] || colors[0],
                    x: springX.get() * 1.5,
                    y: springY.get() * 1.5,
                }}
                className="mesh-sphere w-[400px] h-[400px] bottom-0 left-1/2 -translate-x-1/2 opacity-5"
            />

            {/* Grain/Texture Overlay (Optional for professional feel) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};
