'use client';
import { motion } from 'framer-motion';
import { Wallet, Vote, TrendingUp, Gift } from 'lucide-react';

export const HowItWorks = () => {
    const steps = [
        {
            icon: Wallet,
            title: 'Connect Wallet',
            description: 'Link your Solana wallet (Phantom, Solflare) to get started.',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Vote,
            title: 'Vote on Predictions',
            description: 'Use your $PROPHET tokens to vote YES or NO on crypto predictions.',
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: TrendingUp,
            title: 'Track Results',
            description: 'Watch the predictions unfold and see if you were right.',
            color: 'from-green-500 to-emerald-500',
        },
        {
            icon: Gift,
            title: 'Earn Rewards',
            description: 'Correct predictions earn you rewards from the prize pool.',
            color: 'from-yellow-500 to-orange-500',
        },
    ];

    return (
        <section className="py-20 px-6 bg-gray-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        How It Works
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Start predicting the future in 4 simple steps.
                    </p>
                </motion.div>

                {/* Steps Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="relative"
                        >
                            {/* Step Number */}
                            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl border-4 border-gray-900 z-10">
                                {index + 1}
                            </div>

                            {/* Card */}
                            <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-all h-full">
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6`}>
                                    <step.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-gray-400">{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
