'use client';

import React from 'react';

export const PolybetLogo = ({ className = "h-8 w-8" }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" /> {/* purple-400 */}
                    <stop offset="100%" stopColor="#db2777" /> {/* pink-600 */}
                </linearGradient>
            </defs>
            {/* Outer Hexagon */}
            <path
                d="M50 5L89 27.5V72.5L50 95L11 72.5V27.5L50 5Z"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {/* Vertical stem line */}
            <path
                d="M30 27.5V72.5"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
            />
            {/* Top cube face lines */}
            <path
                d="M50 5V38.75M11 27.5L50 50L89 27.5"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {/* Internal P structure lines */}
            <path
                d="M30 50L50 38.75L69.5 50L50 61.25L30 50Z"
                stroke="url(#logo-gradient)"
                strokeWidth="3.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="url(#logo-gradient)"
                fillOpacity="0.05"
            />
            <path
                d="M50 50V72.5L11 50M89 50L50 72.5V95M69.5 50V72.5L50 83.75"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <path
                d="M30 50L30 72.5L50 61.25M69.5 50L69.5 27.5"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
};
