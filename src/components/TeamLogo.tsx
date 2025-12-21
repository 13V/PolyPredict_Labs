'use client';

import { Swords, Shield } from 'lucide-react';

interface TeamLogoProps {
    name: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * TeamLogo renders an industrial-styled logo or fallback for sports teams.
 * In a real-world scenario, this would fetch from a CDN or Logo API.
 */
export const TeamLogo = ({ name, className = "", style = {} }: TeamLogoProps) => {
    // Basic heuristics for logo colors or symbols if we were to generate them
    const getTeamInitials = (teamName: string) => {
        const parts = teamName.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return teamName.slice(0, 2).toUpperCase();
    };

    const initials = getTeamInitials(name);

    return (
        <div
            className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
            style={{ ...style }}
        >
            {/* The "Shield" container */}
            <div className="absolute inset-0 border-2 border-black/10 flex items-center justify-center bg-white/5">
                <Shield className="w-full h-full text-black/[0.03]" strokeWidth={1} />
            </div>

            {/* The "Initials" as the core brand mark */}
            <span className="relative z-10 font-black text-black/20 text-4xl italic tracking-tighter font-mono">
                {initials}
            </span>

            {/* Technical Metadata overlay for that "System" feel */}
            <div className="absolute bottom-1 right-1 flex flex-col items-end opacity-20">
                <span className="text-[6px] font-black uppercase tracking-widest leading-none">ID_REF</span>
                <span className="text-[6px] font-mono leading-none">{name.slice(0, 3).toUpperCase()}_0x</span>
            </div>
        </div>
    );
};
