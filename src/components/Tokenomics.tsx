'use client';
import { motion } from 'framer-motion';
import { Coins, Lock, TrendingUp, Users } from 'lucide-react';

export const Tokenomics = () => {
    const distribution = [
        { label: 'LIQUIDITY_RESERVE', percentage: 40, color: 'bg-black' },
        { label: 'PROTOCOL_GENESIS', percentage: 30, color: 'bg-black' },
        { label: 'MERIT_POOL', percentage: 20, color: 'bg-orange-600' },
        { label: 'INTEL_CAMPAIGN', percentage: 10, color: 'bg-black/40' },
    ];

    const features = [
        {
            icon: Coins,
            title: 'EXECUTION_FUEL',
            description: '$PREDICT is the required fuel for terminal operations and position entry.',
        },
        {
            icon: Lock,
            title: 'SUPPLY_THROTTLE',
            description: '1% of transaction volume is programmatically incinerated (BURN).',
        },
        {
            icon: TrendingUp,
            title: 'YIELD_MECHANISM',
            description: 'Stake assets to access pro-rata distributions from the Merit Pool.',
        },
        {
            icon: Users,
            title: 'GOVERNANCE_SIGNAL',
            description: 'Holders provide consensus for protocol upgrades and market parameters.',
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
                    className="mb-20 text-center"
                >
                    <div className="flex items-center gap-3 mb-6 justify-center">
                        <span className="bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest italic whitespace-nowrap">NETWORK_ECONOMICS</span>
                        <div className="h-[2px] w-full md:w-32 bg-black/10" />
                    </div>
                    <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic leading-[0.85]">
                        Tokenomics<br />Architecture
                    </h2>
                    <p className="text-sm font-bold text-black/40 uppercase tracking-[0.2em] font-mono max-w-2xl mx-auto">
                        $PREDICT is engineered for protocol growth via deflationary pressure and terminal utility.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-0 border-2 border-black">
                    {/* Distribution Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-10 border-b-2 lg:border-b-0 lg:border-r-2 border-black"
                    >
                        <h3 className="text-sm font-black mb-10 uppercase tracking-widest flex items-center gap-3">
                            <span className="w-2 h-2 bg-orange-600 animate-pulse" />
                            ASSET_ALLOCATION_MATRIX
                        </h3>

                        <div className="space-y-8">
                            {distribution.map((item, index) => (
                                <div key={index} className="group">
                                    <div className="flex justify-between mb-3 items-end">
                                        <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                                        <span className="text-2xl font-mono font-black text-orange-600 tracking-tighter">{item.percentage}%</span>
                                    </div>
                                    <div className="h-6 bg-gray-100 border border-black overflow-hidden relative">
                                        <motion.div
                                            initial={{ x: '-100%' }}
                                            whileInView={{ x: '0%' }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1, duration: 1, ease: 'circOut' }}
                                            className={`absolute inset-0 ${item.color}`}
                                            style={{ right: `${100 - item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 pt-10 border-t-2 border-dashed border-black/10">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="p-4 bg-black text-white border border-black">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">TOTAL_SUPPLY</p>
                                    <p className="text-3xl font-black font-mono tracking-tighter italic">1,000,000,000</p>
                                </div>
                                <div className="p-4 bg-orange-600 text-white border border-black">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">BURN_THROTTLE</p>
                                    <p className="text-3xl font-black font-mono tracking-tighter italic">1.00%</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 gap-0">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-8 border-b-2 sm:border-r-2 border-black last:border-b-0 even:sm:border-r-0 group hover:bg-black hover:text-white transition-all"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <feature.icon className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors" />
                                    <span className="text-[10px] font-mono font-black opacity-20">0{index + 1}</span>
                                </div>
                                <h4 className="text-2xl font-black mb-4 uppercase italic tracking-tighter leading-none">{feature.title}</h4>
                                <p className="text-sm font-bold opacity-60 group-hover:opacity-100 leading-relaxed italic">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
