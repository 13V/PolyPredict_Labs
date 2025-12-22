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
    'wizards': 'https://upload.wikimedia.org/wikipedia/en/0/02/Washington_Wizards_logo.svg',

    // Crypto
    'bitcoin': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg',
    'btc': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg',
    'ethereum': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Ethereum-icon-purple.svg',
    'eth': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Ethereum-icon-purple.svg',
    'solana': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Solana_cryptocurrency_two.svg',
    'sol': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Solana_cryptocurrency_two.svg'
};

const NFL_LOGOS: Record<string, string> = {
    // AFC East
    'bills': 'https://upload.wikimedia.org/wikipedia/en/7/77/Buffalo_Bills_logo.svg',
    'dolphins': 'https://upload.wikimedia.org/wikipedia/en/3/37/Miami_Dolphins_logo.svg',
    'patriots': 'https://upload.wikimedia.org/wikipedia/en/b/b9/New_England_Patriots_logo.svg',
    'jets': 'https://upload.wikimedia.org/wikipedia/en/6/6b/New_York_Jets_logo.svg',

    // AFC North
    'ravens': 'https://upload.wikimedia.org/wikipedia/en/1/16/Baltimore_Ravens_logo.svg',
    'bengals': 'https://upload.wikimedia.org/wikipedia/en/8/81/Cincinnati_Bengals_logo.svg',
    'browns': 'https://upload.wikimedia.org/wikipedia/en/d/d9/Cleveland_Browns_logo.svg',
    'steelers': 'https://upload.wikimedia.org/wikipedia/en/d/de/Pittsburgh_Steelers_logo.svg',

    // AFC South
    'texans': 'https://upload.wikimedia.org/wikipedia/en/2/28/Houston_Texans_logo.svg',
    'colts': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Indianapolis_Colts_logo.svg',
    'jaguars': 'https://upload.wikimedia.org/wikipedia/en/7/74/Jacksonville_Jaguars_logo.svg',
    'titans': 'https://upload.wikimedia.org/wikipedia/en/c/c1/Tennessee_Titans_logo.svg',

    // AFC West
    'broncos': 'https://upload.wikimedia.org/wikipedia/en/4/44/Denver_Broncos_logo.svg',
    'chiefs': 'https://upload.wikimedia.org/wikipedia/en/e/e1/Kansas_City_Chiefs_logo.svg',
    'raiders': 'https://upload.wikimedia.org/wikipedia/en/e/ec/Oakland_Raiders_logo.svg',
    'chargers': 'https://upload.wikimedia.org/wikipedia/en/a/a6/Los_Angeles_Chargers_logo.svg',

    // NFC East
    'cowboys': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Dallas_Cowboys.svg',
    'giants': 'https://upload.wikimedia.org/wikipedia/commons/6/60/New_York_Giants_logo.svg',
    'eagles': 'https://upload.wikimedia.org/wikipedia/en/8/8e/Philadelphia_Eagles_logo.svg',
    'commanders': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Washington_Commanders_logo.svg',

    // NFC North
    'bears': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Chicago_Bears_logo.svg',
    'lions': 'https://upload.wikimedia.org/wikipedia/en/7/71/Detroit_Lions_logo.svg',
    'packers': 'https://upload.wikimedia.org/wikipedia/commons/5/50/Green_Bay_Packers_logo.svg',
    'vikings': 'https://upload.wikimedia.org/wikipedia/en/4/48/Minnesota_Vikings_logo.svg',

    // NFC South
    'falcons': 'https://upload.wikimedia.org/wikipedia/en/c/c5/Atlanta_Falcons_logo.svg',
    'panthers': 'https://upload.wikimedia.org/wikipedia/en/1/1a/Carolina_Panthers_logo.svg',
    'saints': 'https://upload.wikimedia.org/wikipedia/commons/5/50/New_Orleans_Saints_logo.svg',
    'buccaneers': 'https://upload.wikimedia.org/wikipedia/en/a/a2/Tampa_Bay_Buccaneers_logo.svg',

    // NFC West
    'cardinals': 'https://upload.wikimedia.org/wikipedia/en/7/72/Arizona_Cardinals_logo.svg',
    'rams': 'https://upload.wikimedia.org/wikipedia/en/8/8a/Los_Angeles_Rams_logo.svg',
    '49ers': 'https://upload.wikimedia.org/wikipedia/commons/5/59/San_Francisco_49ers_logo.svg',
    'seahawks': 'https://upload.wikimedia.org/wikipedia/en/8/8e/Seattle_Seahawks_logo.svg',
    'niners': 'https://upload.wikimedia.org/wikipedia/commons/5/59/San_Francisco_49ers_logo.svg'
};

const NHL_LOGOS: Record<string, string> = {
    // Pacific
    'ducks': 'https://upload.wikimedia.org/wikipedia/en/7/72/Anaheim_Ducks.svg',
    'flames': 'https://upload.wikimedia.org/wikipedia/en/6/60/Calgary_Flames_Logo.svg',
    'oilers': 'https://upload.wikimedia.org/wikipedia/en/4/4d/Edmonton_Oilers_Logo_2017.svg',
    'kings': 'https://upload.wikimedia.org/wikipedia/en/c/c7/SacramentoKings.svg', // Default to NBA Kings due to overlap
    'nhl_kings': 'https://upload.wikimedia.org/wikipedia/en/6/63/Los_Angeles_Kings_logo.svg',
    'sharks': 'https://upload.wikimedia.org/wikipedia/en/3/37/San_Jose_Sharks_Logo.svg',
    'kraken': 'https://upload.wikimedia.org/wikipedia/en/4/48/Seattle_Kraken_official_logo.svg',
    'canucks': 'https://upload.wikimedia.org/wikipedia/en/3/3a/Vancouver_Canucks_logo.svg',
    'golden knights': 'https://upload.wikimedia.org/wikipedia/en/a/ac/Vegas_Golden_Knights_logo.svg',
    'knights': 'https://upload.wikimedia.org/wikipedia/en/a/ac/Vegas_Golden_Knights_logo.svg',

    // Central
    'coyotes': 'https://upload.wikimedia.org/wikipedia/en/2/27/Arizona_Coyotes.svg',
    'blackhawks': 'https://upload.wikimedia.org/wikipedia/en/2/29/Chicago_Blackhawks_logo.svg',
    'avalanche': 'https://upload.wikimedia.org/wikipedia/en/4/45/Colorado_Avalanche_logo.svg',
    'stars': 'https://upload.wikimedia.org/wikipedia/en/c/ce/Dallas_Stars_logo_%282013%29.svg',
    'wild': 'https://upload.wikimedia.org/wikipedia/en/1/1b/Minnesota_Wild.svg',
    'predators': 'https://upload.wikimedia.org/wikipedia/en/9/9c/Nashville_Predators_Logo_%282011%29.svg',
    'blues': 'https://upload.wikimedia.org/wikipedia/en/e/e0/St._Louis_Blues_logo_2008.svg',
    'jets': 'https://upload.wikimedia.org/wikipedia/en/9/93/Winnipeg_Jets_Logo_2011.svg',

    // Metropolitan
    'hurricanes': 'https://upload.wikimedia.org/wikipedia/en/3/32/Carolina_Hurricanes.svg',
    'blue jackets': 'https://upload.wikimedia.org/wikipedia/en/5/5d/Columbus_Blue_Jackets_logo.svg',
    'devils': 'https://upload.wikimedia.org/wikipedia/en/9/9f/New_Jersey_Devils_logo.svg',
    'islanders': 'https://upload.wikimedia.org/wikipedia/en/4/42/Logo_New_York_Islanders.svg',
    'rangers': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/New_York_Rangers.svg',
    'flyers': 'https://upload.wikimedia.org/wikipedia/en/d/dc/Philadelphia_Flyers.svg',
    'penguins': 'https://upload.wikimedia.org/wikipedia/en/c/c0/Pittsburgh_Penguins_logo_%282016%29.svg',
    'capitals': 'https://upload.wikimedia.org/wikipedia/en/2/2d/Washington_Capitals.svg',

    // Atlantic
    'bruins': 'https://upload.wikimedia.org/wikipedia/en/1/12/Boston_Bruins.svg',
    'sabres': 'https://upload.wikimedia.org/wikipedia/en/9/9e/Buffalo_Sabres_Logo.svg',
    'red wings': 'https://upload.wikimedia.org/wikipedia/en/e/e0/Detroit_Red_Wings_logo.svg',
    'canadiens': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Montreal_Canadiens.svg',
    'senators': 'https://upload.wikimedia.org/wikipedia/en/b/b2/Ottawa_Senators_2020-2021_logo.svg',
    'lightning': 'https://upload.wikimedia.org/wikipedia/en/2/2f/Tampa_Bay_Lightning_Logo_2011.svg',
    'maple leafs': 'https://upload.wikimedia.org/wikipedia/en/b/b6/Toronto_Maple_Leafs_2016_logo.svg'
};

const getLogoUrl = (name: string): string | null => {
    const cleanName = name.toLowerCase().trim();

    // Merge all dictionaries
    const ALL_LOGOS = { ...NBA_LOGOS, ...NFL_LOGOS, ...NHL_LOGOS };

    // Direct lookup first
    if (ALL_LOGOS[cleanName]) return ALL_LOGOS[cleanName];

    // Substring lookup (e.g., "houston rockets" -> matches "rockets")
    for (const [key, url] of Object.entries(ALL_LOGOS)) {
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
                        className="w-[85%] h-[85%] object-contain opacity-60 grayscale contrast-125 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
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
            <div className="absolute bottom-6 right-6 flex flex-col items-end opacity-80 text-black">
                <span className="text-[12px] font-black uppercase tracking-widest leading-none">ID_REF</span>
                <span className="text-[12px] font-mono leading-none">{name.slice(0, 3).toUpperCase()}_0x</span>
            </div>
        </div>
    );
};
