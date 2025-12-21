'use client';
import { motion } from 'framer-motion';
import { Check, Rocket, Target, Trophy, Zap } from 'lucide-react';

export const Roadmap = () => {
    const phases = [
        {
            stage: '01',
            title: 'PROTOCOL_INIT',
            status: 'completed',
            icon: Rocket,
            items: [
                'Execution Engine MVP',
                'Wallet Interface Sync',
                'Genesis Market Batches',
                'Community Nexus Established',
            ],
        },
        {
            stage: '02',
            title: 'TERMINAL_DEPLOY',
            status: 'current',
            icon: Zap,
            items: [
                'Fair Launch: Pump.fun',
                'Liquidity Vault Lock (365d)',
                'Token-Gated Market Access',
                'Global Intel Campaign',
            ],
        },
        {
            stage: '03',
            title: 'MERIT_PROTOCOL',
            status: 'upcoming',
            icon: Trophy,
            items: [
                'Dynamic Leaderboard Feed',
                'Automated Reward Distributions',
                'Staking Throttles',
                'NFT Identity Certificates',
            ],
        },
        {
            stage: '04',
            title: 'GOVERNANCE_EXPANSION',
            status: 'upcoming',
            icon: Target,
            items: [
                'Community Signal Voting',
                'Protocol Improvement Proposals',
                'Treasury Vault Control',
                'Cross-Chain Intel Expansion',
            ],
        },
    ];

    return (
        <section className="py-24 px-6 bg-white border-t-2 border-black relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-5" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-20"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <span className="bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest italic">SYSTEM_EVOLUTION</span>
                        <div className="h-[2px] flex-1 bg-black/10" />
                    </div>
                    <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic leading-[0.85]">
                        Roadmap<br />Milestones
                    </h2>
                    <p className="text-sm font-bold text-black/40 uppercase tracking-[0.2em] font-mono max-w-2xl">Visualizing the progression of the PolyPredict decentralized intelligence network.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black">
                    {phases.map((phase, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-white border-b-2 sm:border-b-0 md:border-r-2 last:border-r-0 border-black p-8 group hover:bg-black hover:text-white transition-colors flex flex-col`}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-2xl font-mono font-black text-orange-600">[{phase.stage}]</span>
                                {phase.status === 'completed' && (
                                    <span className="text-[10px] font-black px-2 py-1 bg-black text-white group-hover:bg-white group-hover:text-black border border-black uppercase italic">SYNCED</span>
                                )}
                                {phase.status === 'current' && (
                                    <span className="text-[10px] font-black px-2 py-1 bg-orange-600 text-white border border-black uppercase italic animate-pulse">ACTIVE_OP</span>
                                )}
                                {phase.status === 'upcoming' && (
                                    <span className="text-[10px] font-black px-2 py-1 bg-white text-black/20 border border-black/10 uppercase italic">QUEUED</span>
                                )}
                            </div>

                            <h3 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">{phase.title}</h3>

                            <ul className="space-y-4 mb-12 flex-1">
                                {phase.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        {phase.status === 'completed' ? (
                                            <Check className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 bg-black/20 group-hover:bg-white/40 shrink-0 mt-2" />
                                        )}
                                        <span className="text-xs font-bold leading-tight uppercase opacity-60 group-hover:opacity-100">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-8 border-t border-black/5 group-hover:border-white/10">
                                <phase.icon className="w-8 h-8 opacity-10 group-hover:opacity-100 group-hover:text-orange-600 transition-all" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
