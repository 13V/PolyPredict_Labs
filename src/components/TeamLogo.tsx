'use client';

import { Swords, Shield } from 'lucide-react';

interface TeamLogoProps {
    name: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * TeamLogo renders an industrial-styled logo or fallback for sports teams.
 */
export const TeamLogo = ({ name, className = "", style = {} }: TeamLogoProps) => {
    // Basic heuristics for logo colors or symbols if we were to generate them
    const getTeamInitials = (teamName: string) => {
        // Handle names like "NOTTINGHAM FOREST FC" -> "NF"
        const parts = teamName.split(' ').filter(p => !['FC', 'SC', 'CF', 'AFC', 'REAL', 'ST', 'THE'].includes(p.toUpperCase()));
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return teamName.slice(0, 2).toUpperCase();
    };

    // If the name is "Yes" or "No", don't show anything useful
    if (['YES', 'NO'].includes(name.toUpperCase())) return null;

    const initials = getTeamInitials(name);

    return (
        <div
            className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
            style={{ ...style }}
        >
            {/* The "Shield" container */}
            <div className="absolute inset-0 border-8 border-black/[0.08] flex items-center justify-center bg-white/5">
                <Shield className="w-full h-full text-black/[0.15]" strokeWidth={3} />
            </div>

            {/* The "Initials" as the core brand mark - CRITICAL VISIBILITY */}
            <span className="relative z-10 font-black text-black/[0.12] text-[120px] italic tracking-tighter font-mono leading-none">
                {initials}
            </span>

            {/* Technical Metadata overlay for that "System" feel */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end opacity-40">
                <span className="text-[12px] font-black uppercase tracking-widest leading-none">ID_REF</span>
                <span className="text-[12px] font-mono leading-none">{name.slice(0, 3).toUpperCase()}_0x</span>
            </div>
        </div>
    );
};
