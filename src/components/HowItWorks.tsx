'use client';
import { motion } from 'framer-motion';
import { Wallet, Vote, TrendingUp, Gift } from 'lucide-react';

export const HowItWorks = () => {
    const steps = [
        {
            icon: Wallet,
            title: 'PROTOCOL_AUTH',
            description: 'Initialize connection with Solana network (Phantom/Solflare).',
        },
        {
            icon: Vote,
            title: 'EXECUTE_ORDER',
            description: 'Allocate $PREDICT tokens to verified outcome streams.',
        },
        {
            icon: TrendingUp,
            title: 'INTEL_MONITOR',
            description: 'Track real-time data feeds and market volatility metrics.',
        },
        {
            icon: Gift,
            title: 'YIELD_CLAIM',
            description: 'Settle correct forecasts and extract protocol rewards.',
        },
    ];

    return (
        <section className="py-24 px-6 border-y-2 border-black bg-white relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-5" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-block bg-black text-white text-[10px] font-black px-4 py-1 mb-6 uppercase tracking-[0.3em] italic">
                        PROTOCOL_OPERATIONS
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black mb-4 text-black uppercase tracking-tighter italic leading-none">
                        HOW_IT_WORKS
                    </h2>
                    <p className="text-sm font-mono font-bold text-black/40 uppercase max-w-xl mx-auto tracking-widest">
                        Standard_Operating_Procedures for high-frequency prediction markets.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="relative p-10 bg-white border-black md:border-r-2 last:border-r-0 group hover:bg-black transition-colors duration-200"
                        >
                            {/* Step Number */}
                            <div className="absolute top-4 right-4 text-4xl font-black text-black/5 group-hover:text-white/10 transition-colors">
                                0{index + 1}
                            </div>

                            <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
                                <div className={`w-16 h-16 border-2 border-black bg-white flex items-center justify-center mb-8 group-hover:bg-orange-600 group-hover:border-white transition-all`}>
                                    <step.icon className="w-8 h-8 text-black group-hover:text-white" />
                                </div>
                                <h3 className="text-xl font-black text-black mb-4 uppercase tracking-tighter italic group-hover:text-white">{step.title}</h3>
                                <p className="text-xs font-mono font-bold text-black/60 group-hover:text-white/70 uppercase leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
