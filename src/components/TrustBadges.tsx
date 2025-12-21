'use client';
import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, Users } from 'lucide-react';

export const TrustBadges = () => {
    const badges = [
        {
            icon: Shield,
            title: 'AUDIT_VERIFIED',
            description: 'Core logic validated by top-tier security labs',
        },
        {
            icon: Lock,
            title: 'LP_ENCRYPTION',
            description: '40% liquidity locked via protocol smart-contract',
        },
        {
            icon: CheckCircle,
            title: 'PROTOCOL_EQUITY',
            description: 'Zero team allocation. Full public distribution.',
        },
        {
            icon: Users,
            title: 'GOVERNANCE_CONSENSUS',
            description: 'Decentralized management by $PREDICT holders',
        },
    ];

    return (
        <section className="py-24 px-6 bg-white border-y-2 border-black relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-5" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black bg-black">
                    {badges.map((badge, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-10 border-black border-r-2 last:border-r-0 lg:border-r-2 group hover:bg-black transition-all"
                        >
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white group-hover:bg-orange-600 transition-colors mb-8">
                                <badge.icon className="w-6 h-6" strokeWidth={3} />
                            </div>
                            <h3 className="text-black group-hover:text-white font-black text-xs uppercase tracking-[0.3em] mb-4 italic leading-none">{badge.title}</h3>
                            <p className="text-black/40 group-hover:text-white/60 font-bold text-[10px] uppercase tracking-widest leading-relaxed italic">{badge.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
