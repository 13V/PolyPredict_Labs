'use client';
import { motion } from 'framer-motion';
import { Users, Vote, TrendingUp, Zap } from 'lucide-react';

export const Stats = () => {
    const stats = [
        {
            icon: Users,
            value: 'TBD',
            label: 'USER_SIGNAL_BASE',
        },
        {
            icon: Vote,
            value: '10',
            label: 'ACTIVE_TERMINALS',
        },
        {
            icon: TrendingUp,
            value: '100%',
            label: 'EQUITY_FAIRNESS',
        },
        {
            icon: Zap,
            value: '1B',
            label: 'PROTOCOL_SUPPLY',
        },
    ];

    return (
        <section className="py-24 px-6 bg-white border-y-2 border-black relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-5" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-black bg-black">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-12 border-black border-r-2 last:border-r-0 md:border-r-2 group hover:bg-black transition-all text-center"
                        >
                            <stat.icon className="w-8 h-8 mx-auto mb-6 text-orange-600 group-hover:text-white transition-colors" strokeWidth={3} />
                            <div className="text-5xl font-black text-black group-hover:text-white mb-2 font-mono tracking-tighter italic leading-none">{stat.value}</div>
                            <div className="text-black/40 group-hover:text-white/60 text-[10px] uppercase font-black tracking-widest leading-none">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
