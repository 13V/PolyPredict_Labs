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
            {/* Outer Hexagon Border */}
            <path
                d="M50 5L89 27.5V72.5L50 95L11 72.5V27.5L50 5Z"
                stroke="url(#logo-gradient)"
                strokeWidth="5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {/* Vertical Stem of the P */}
            <path
                d="M35 25V75"
                stroke="url(#logo-gradient)"
                strokeWidth="7"
                strokeLinecap="round"
            />
            {/* Top Loop of the P (Isometric) */}
            <path
                d="M35 25L65 42L65 60L35 43"
                stroke="url(#logo-gradient)"
                strokeWidth="7"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {/* Internal Geometric Detail to give it the 3D 'Poly' feel */}
            <path
                d="M35 43L50 52L65 42"
                stroke="url(#logo-gradient)"
                strokeWidth="3"
                strokeOpacity="0.5"
                strokeLinejoin="round"
            />
        </svg>
    );
};
