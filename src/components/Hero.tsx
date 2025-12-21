'use client';
import { motion } from 'framer-motion';
import { Wallet, Vote, TrendingUp, Zap, ArrowRight, ShieldCheck, Globe, Activity } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

export const Hero = () => {
    const { connected } = useWallet();

    const stats = [
        { label: 'NETWORK_STATUS', value: 'OPERATIONAL', icon: Activity },
        { label: 'PROTOCOL_LAYER', value: 'SOLANA_MAINNET', icon: Globe },
        { label: 'ORACLE_VERIFIED', value: 'TRUE', icon: ShieldCheck },
    ];

    const steps = [
        { icon: Wallet, title: 'PHASE_01: AUTH', desc: 'Secure terminal connection via Solana wallet.' },
        { icon: Vote, title: 'PHASE_02: ALLOCATE', desc: 'Commit $PREDICT to verified outcome streams.' },
        { icon: Zap, title: 'PHASE_03: RESOLVE', desc: 'Settle correct signals and extract protocol yield.' },
    ];

    return (
        <section className="relative pt-12 pb-20 border-b-4 border-black bg-white overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 dot-grid opacity-[0.15]" />
            <div className="absolute top-0 right-0 w-1/3 h-full border-l-2 border-black/5 flex items-center justify-center opacity-10 pointer-events-none select-none">
                <span className="text-[20rem] font-black italic rotate-90 translate-x-1/2">PREDICT</span>
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: About */}
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 bg-black text-white text-[10px] font-black px-4 py-1 uppercase tracking-[0.3em] italic shadow-[4px_4px_0px_0px_rgba(234,88,12,1)]">
                                MISSION_MANIFEST_V1.0
                            </div>
                            <h2 className="text-6xl md:text-8xl font-black text-black uppercase tracking-tighter italic leading-[0.85]">
                                DECENTRALIZED<br />
                                <span className="text-orange-600">INTELLIGENCE</span>
                            </h2>
                            <p className="text-sm md:text-base font-black text-black/60 uppercase max-w-xl leading-relaxed tracking-tight">
                                PolyPredict is a high-fidelity oracle protocol designed for precision forecasting.
                                We transform market volatility into verifiable intelligence through decentralized skin-in-the-game mechanics.
                            </p>
                        </div>

                        {/* Status Ticker */}
                        <div className="flex flex-wrap gap-8 border-y-2 border-black py-4">
                            {stats.map((s, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <s.icon size={14} className="text-orange-600" />
                                    <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">{s.label}:</span>
                                    <span className="text-[10px] font-mono font-black text-black">{s.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-6">
                            {!connected ? (
                                <div className="text-[11px] font-black text-orange-600 uppercase tracking-widest animate-pulse">
                                    // TERMINAL_ACCESS_LOCKED: CONNECT_WALLET_TO_BEGIN
                                </div>
                            ) : (
                                <div className="text-[11px] font-black text-green-600 uppercase tracking-widest">
                                    // TERMINAL_AUTH_SUCCESS: READY_FOR_DEPLOYMENT
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: How It Works */}
                    <div className="relative">
                        <div className="bg-black p-8 md:p-12 border-[4px] border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rotate-45 translate-x-16 -translate-y-16" />

                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-10 border-b border-white/20 pb-4">
                                PROTOCOL_OPERATIONS
                            </h3>

                            <div className="space-y-12">
                                {steps.map((step, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="shrink-0 w-12 h-12 border-2 border-white bg-transparent flex items-center justify-center text-white group-hover:bg-orange-600 group-hover:border-orange-600 transition-all duration-300">
                                            <step.icon size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest italic">{step.title}</h4>
                                            <p className="text-[10px] font-mono font-bold text-white/40 uppercase leading-relaxed group-hover:text-white/80 transition-colors">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/20">
                                <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                                    NOTICE: ALL BETS ARE FINAL. VERIFICATION IS SETTLED BY DECENTRALIZED ORACLES UPON MARKET EXPIRY.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
