'use client';

import { motion } from 'framer-motion';

interface SparklineProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
    data,
    color = '#10B981', // Emerald-500 default
    width = 120,
    height = 40
}) => {
    // Use fixed 0-100 domain for probability charts
    const min = 0;
    const max = 100;
    const range = max - min;

    // Create SVG path
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        // Clamp value between 0-100 just in case
        const clampedVal = Math.max(0, Math.min(100, val));
        const normalizedY = (clampedVal - min) / range;
        const y = height - (normalizedY * height); // Invert Y for SVG
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <motion.path
                d={`M ${points}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* Add a subtle gradient fill area if we wanted, but stick to line for now */}
        </svg>
    );
};
