'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const LaunchCountdown = () => {
    const [timeLeft, setTimeLeft] = useState({
        days: 7,
        hours: 12,
        minutes: 30,
        seconds: 45,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { days, hours, minutes, seconds } = prev;

                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                } else if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                } else if (days > 0) {
                    days--;
                    hours = 23;
                    minutes = 59;
                    seconds = 59;
                }

                return { days, hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const timeUnits = [
        { label: 'DAYS', value: timeLeft.days },
        { label: 'HOURS', value: timeLeft.hours },
        { label: 'MINUTES', value: timeLeft.minutes },
        { label: 'SECONDS', value: timeLeft.seconds },
    ];

    return (
        <section className="py-24 px-6 bg-white border-t-2 border-black relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-5" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <div className="flex items-center gap-3 mb-6 justify-center">
                        <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest italic whitespace-nowrap">T-MINUS_GENESIS</span>
                        <div className="h-[2px] w-full md:w-32 bg-black/10" />
                    </div>

                    <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic leading-[0.85]">
                        Protocol<br />Deployment
                    </h2>
                    <p className="text-sm font-bold text-black/40 uppercase tracking-[0.2em] font-mono max-w-2xl mx-auto mb-16">
                        PolyPredict mainnet synchronization in progress. Prepare terminal for signal entry.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-black bg-black max-w-4xl mx-auto">
                        {timeUnits.map((unit, index) => (
                            <motion.div
                                key={unit.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-8 md:p-12 border-black border-r-2 last:border-r-0 md:even:border-r-2"
                            >
                                <div className="text-6xl md:text-8xl font-black font-mono tracking-tighter italic text-black leading-none mb-4">
                                    {unit.value.toString().padStart(2, '0')}
                                </div>
                                <div className="text-black/40 text-[10px] font-black uppercase tracking-[0.3em]">{unit.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16">
                        <button className="neo-button bg-black text-white px-12 py-5 text-sm font-black uppercase tracking-[0.2em] italic hover:bg-orange-600 transition-all">
                            REGISTER_FOR_WHITELIST
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
