'use client';

import { Swords, Shield } from 'lucide-react';

interface TeamLogoProps {
    name: string;
    className?: string;
    style?: React.CSSProperties;
}

const NBA_LOGOS: Record<string, string> = {
    // Pacific
    'warriors': 'https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg',
    'lakers': 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg',
    'clippers': 'https://upload.wikimedia.org/wikipedia/en/b/bb/Los_Angeles_Clippers_%282015%29.svg',
    'suns': 'https://upload.wikimedia.org/wikipedia/en/d/dc/Phoenix_Suns_logo.svg',
    'kings': 'https://upload.wikimedia.org/wikipedia/en/c/c7/SacramentoKings.svg',

    // Northwest
    'nuggets': 'https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg',
    'timberwolves': 'https://upload.wikimedia.org/wikipedia/en/c/c2/Minnesota_Timberwolves_logo.svg',
    'thunder': 'https://upload.wikimedia.org/wikipedia/en/5/5d/Oklahoma_City_Thunder.svg',
    'blazers': 'https://upload.wikimedia.org/wikipedia/en/2/21/Portland_Trail_Blazers_logo.svg',
    'jazz': 'https://upload.wikimedia.org/wikipedia/en/0/04/Utah_Jazz_logo_%282016%29.svg',

    // Southwest
    'mavericks': 'https://upload.wikimedia.org/wikipedia/en/9/97/Dallas_Mavericks_logo.svg',
    'rockets': 'https://upload.wikimedia.org/wikipedia/en/2/28/Houston_Rockets.svg',
    'grizzlies': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Memphis_Grizzlies.svg',
    'pelicans': 'https://upload.wikimedia.org/wikipedia/en/0/0d/New_Orleans_Pelicans_logo.svg',
    'spurs': 'https://upload.wikimedia.org/wikipedia/en/a/a2/San_Antonio_Spurs.svg',

    // Atlantic
    'celtics': 'https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg',
    'nets': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Brooklyn_Nets_newlogo.svg',
    'knicks': 'https://upload.wikimedia.org/wikipedia/en/2/25/New_York_Knicks_logo.svg',
    'sixers': 'https://upload.wikimedia.org/wikipedia/en/0/0e/Philadelphia_76ers_logo.svg',
    'raptors': 'https://upload.wikimedia.org/wikipedia/en/3/36/Toronto_Raptors_logo.svg',

    // Central
    'bulls': 'https://upload.wikimedia.org/wikipedia/en/6/67/Chicago_Bulls_logo.svg',
    'cavaliers': 'https://upload.wikimedia.org/wikipedia/en/4/4b/Cleveland_Cavaliers_logo.svg',
    'pistons': 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Pistons_logo17.svg',
    'pacers': 'https://upload.wikimedia.org/wikipedia/en/1/1b/Indiana_Pacers.svg',
    'bucks': 'https://upload.wikimedia.org/wikipedia/en/4/4a/Milwaukee_Bucks_logo.svg',

    // Southeast
    'hawks': 'https://upload.wikimedia.org/wikipedia/en/2/24/Atlanta_Hawks_logo.svg',
    'hornets': 'https://upload.wikimedia.org/wikipedia/en/c/c4/Charlotte_Hornets_%282014%29.svg',
    'heat': 'https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg',
    'magic': 'https://upload.wikimedia.org/wikipedia/en/1/10/Orlando_Magic_logo.svg',
    'wizards': 'https://upload.wikimedia.org/wikipedia/en/0/02/Washington_Wizards_logo.svg'
};

const getLogoUrl = (name: string): string | null => {
    const cleanName = name.toLowerCase().trim();

    // Direct lookup first
    if (NBA_LOGOS[cleanName]) return NBA_LOGOS[cleanName];

    // Substring lookup (e.g., "houston rockets" -> matches "rockets")
    for (const [key, url] of Object.entries(NBA_LOGOS)) {
        if (cleanName.includes(key)) return url;
        // Handle city names if possible, but keep it tight to avoid false positives
    }

    return null;
};

/**
 * TeamLogo renders an official NBA logo if found, or an industrial-styled fallback.
 */
export const TeamLogo = ({ name, className = "", style = {} }: TeamLogoProps) => {
    // If the name is "Yes" or "No", don't show anything useful
    if (['YES', 'NO'].includes(name.toUpperCase())) return null;

    const logoUrl = getLogoUrl(name);

    // Basic heuristics for logo colors or symbols if we were to generate them
    const getTeamInitials = (teamName: string) => {
        // Handle names like "NOTTINGHAM FOREST FC" -> "NF"
        const parts = teamName.split(' ').filter(p => !['FC', 'SC', 'CF', 'AFC', 'REAL', 'ST', 'THE'].includes(p.toUpperCase()));
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
            {logoUrl ? (
                // Official Logo found - Render with Industrial Treatment
                <div className="w-full h-full relative flex items-center justify-center">
                    {/* Ghost Shield container for structure */}
                    <div className="absolute inset-0 border-8 border-black/[0.08] flex items-center justify-center bg-white/5 opacity-50 rounded-xl"></div>

                    {/* The Logo itself - Grayscale + High Contrast Ops */}
                    <img
                        src={logoUrl}
                        alt={name}
                        className="w-[80%] h-[80%] object-contain opacity-40 grayscale contrast-125 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                    />
                </div>
            ) : (
                // Fallback: The "Shield" container
                <>
                    <div className="absolute inset-0 border-8 border-black/[0.08] flex items-center justify-center bg-white/5">
                        <Shield className="w-full h-full text-black/[0.15]" strokeWidth={3} />
                    </div>

                    {/* The "Initials" as the core brand mark - CRITICAL VISIBILITY */}
                    <span className="relative z-10 font-black text-black/[0.12] text-[120px] italic tracking-tighter font-mono leading-none">
                        {initials}
                    </span>
                </>
            )}

            {/* Technical Metadata overlay for that "System" feel */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end opacity-40">
                <span className="text-[12px] font-black uppercase tracking-widest leading-none">ID_REF</span>
                <span className="text-[12px] font-mono leading-none">{name.slice(0, 3).toUpperCase()}_0x</span>
            </div>
        </div>
    );
};
