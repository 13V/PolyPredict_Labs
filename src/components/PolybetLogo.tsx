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

            {/* 
               Exact geometrical reconstruction based on the isometric cuboid P.
               The structure is a 2x2x2 cube grid with missing blocks to form a 'P'.
            */}

            {/* Left Vertical Column (Front Face) */}
            <path
                d="M30 25 L50 35 L50 95 L30 85 Z"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Left Vertical Column (Top Face) */}
            <path
                d="M30 25 L50 15 L70 25 L50 35 Z"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Top Horizontal Bar (Front Face) */}
            <path
                d="M50 35 L70 25 L90 35 L70 45 Z" // corrected top-right connection
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Right Vertical Bar (Side Face) - Top part of P loop */}
            <path
                d="M70 45 L90 35 L90 65 L70 75 Z"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Bottom Horizontal Bar of Loop (Bottom Face) */}
            <path
                d="M50 55 L70 65 L70 75 L50 65 Z"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Center Connection (Inner Corner) */}
            <path
                d="M50 55 L50 65"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Outlines for depth definition matching the reference */}
            <path
                d="M50 15 V 35 M 90 35 V 65 L 70 75 L 50 65 V 55 M 70 45 V 65"
                stroke="url(#logo-gradient)"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

        </svg>
    );
};
