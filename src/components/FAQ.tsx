'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
    {
        question: 'What is PolyPredict?',
        answer: 'PolyPredict is a decentralized prediction marketplace built for the speed of Solana. Traders use $PREDICT to execute positions on real-world outcomes, crypto parity, and macro events.',
    },
    {
        question: 'How do I acquire $PREDICT?',
        answer: 'During our initialization phase on Pump.fun, you can acquire $PREDICT by connecting a Solana-compatible terminal (Phantom/Solflare/Backpack) and swapping SOL. Direct access will be enabled via our main terminal post-migration.',
    },
    {
        question: 'What distinguishes PolyPredict from standard memecoins?',
        answer: 'PolyPredict integrates a sophisticated utility layer. $PREDICT is the required fuel for market execution. Winners receive pro-rata distributions from the liquidity pool, creating a merit-based asset class.',
    },
    {
        question: 'When is System Launch?',
        answer: 'We are currently in final-stage stress testing. Launch is imminent via Pump.fun. Monitor our BROADCAST_CHANNELS (Twitter/Telegram) for the T-0 timestamp.',
    },
    {
        question: 'Is Liquidity Verified?',
        answer: 'Affirmative. Initial liquidity is programmatically locked via standard Solana protocols. Total transparency is maintain via on-chain verification.',
    },
    {
        question: 'How are rewards distributed?',
        answer: 'Outcome resolution is determined by decentralized oracles. Upon market finalization, winning $PREDICT holders can claim their amplified position from the contract vault.',
    },
];

export const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-24 px-6 bg-white border-t-2 border-black relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-5" />

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest italic">FAQ_V1.0</span>
                        <div className="h-[2px] flex-1 bg-black/10" />
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase italic leading-[0.9]">
                        System<br />Information
                    </h2>
                    <p className="text-sm font-bold text-black/40 uppercase tracking-widest font-mono">Everything you need to know about the protocol</p>
                </motion.div>

                <div className="space-y-0 border-2 border-black">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className={`group border-b-2 border-black last:border-b-0 ${openIndex === index ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-6 flex items-center justify-between text-left transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-mono font-black ${openIndex === index ? 'text-orange-500' : 'text-black/20'}`}>[{index.toString().padStart(2, '0')}]</span>
                                    <span className="text-xl font-black uppercase tracking-tight italic">{faq.question}</span>
                                </div>
                                <ChevronDown
                                    className={`w-6 h-6 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-orange-500' : 'text-black/20 group-hover:text-black'
                                        }`}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-16 pb-8 pt-2">
                                            <p className="text-sm md:text-base font-bold leading-relaxed opacity-80 border-l-2 border-orange-500 pl-6 italic">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
