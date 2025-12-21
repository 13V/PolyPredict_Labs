'use client';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, Coins, CheckCircle } from 'lucide-react';

export const HowToBuy = () => {
    const steps = [
        {
            icon: Wallet,
            title: 'Initialize Terminal',
            description: 'Download a supported Solana interface (Phantom, Solflare, or Backpack).',
            color: 'bg-black',
        },
        {
            icon: Coins,
            title: 'Load Protocol Fuel',
            description: 'Acquire SOL from a centralized exchange and transfer to your designated terminal address.',
            color: 'bg-black',
        },
        {
            icon: ArrowRight,
            title: 'Access Pump.fun',
            description: 'Locate the $PREDICT sector on Pump.fun and synchronize your terminal.',
            color: 'bg-black',
        },
        {
            icon: CheckCircle,
            title: 'Execute Swap',
            description: 'Swap SOL for $PREDICT. Terminal balance will update upon block confirmation.',
            color: 'bg-orange-600',
        },
    ];

    return (
        <section className="py-24 px-6 bg-white relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-5" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-20 text-center md:text-left"
                >
                    <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                        <span className="bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest italic whitespace-nowrap">ACQUISITION_PROTOCOL</span>
                        <div className="h-[2px] w-full md:w-32 bg-black/10" />
                    </div>
                    <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic leading-[0.85]">
                        How to Acquire<br />$PREDICT Tokens
                    </h2>
                    <p className="text-sm font-bold text-black/40 uppercase tracking-[0.2em] font-mono">Sequential integration procedure for new traders</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white border-b-2 sm:border-b-0 md:border-r-2 last:border-r-0 border-black p-8 group hover:bg-black hover:text-white transition-colors"
                        >
                            <div className="text-[10px] font-mono font-black mb-10 block opacity-20 group-hover:opacity-100 transition-opacity">
                                STEP_0{index + 1}.LOG
                            </div>

                            <div className={`w-14 h-14 border-2 border-black ${step.color} flex items-center justify-center mb-8 group-hover:border-white`}>
                                <step.icon className={`w-6 h-6 ${step.color === 'bg-black' ? 'text-white' : 'text-white'}`} />
                            </div>

                            <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tighter">{step.title}</h3>
                            <p className="text-sm font-bold opacity-60 leading-relaxed italic">{step.description}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 flex flex-col md:flex-row items-center justify-between gap-8 border-t-2 border-black pt-12"
                >
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-mono font-black text-black/40 uppercase tracking-widest mb-1">TERMINAL_STATUS</p>
                        <p className="text-lg font-black uppercase italic">PUMP.FUN_LAUNCH_PREPARATION_ACTIVE</p>
                    </div>

                    <button className="neo-button bg-orange-600 text-white px-10 py-5 font-black uppercase italic text-sm tracking-widest inline-flex items-center gap-4 hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all">
                        Buy Now on Pump.fun
                        <ArrowRight className="w-5 h-5" strokeWidth={3} />
                    </button>
                </motion.div>
            </div>
        </section>
    );
};
