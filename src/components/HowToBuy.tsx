'use client';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, Coins, CheckCircle } from 'lucide-react';

export const HowToBuy = () => {
    const steps = [
        {
            icon: Wallet,
            title: 'Get a Solana Wallet',
            description: 'Download Phantom or Solflare wallet extension for your browser.',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Coins,
            title: 'Buy SOL',
            description: 'Purchase Solana (SOL) from an exchange like Coinbase or Binance and send it to your wallet.',
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: ArrowRight,
            title: 'Go to Pump.fun',
            description: 'Visit pump.fun and search for $POLYBET token. Connect your wallet.',
            color: 'from-green-500 to-emerald-500',
        },
        {
            icon: CheckCircle,
            title: 'Swap SOL for $POLYBET',
            description: 'Enter the amount of SOL you want to swap and confirm the transaction.',
            color: 'from-yellow-500 to-orange-500',
        },
    ];

    return (
        <section className="py-20 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        How to Buy $POLYBET
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Get your tokens in 4 simple steps
                    </p>
                </motion.div>

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
                            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl border-4 border-gray-950 z-10">
                                {index + 1}
                            </div>

                            <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-all h-full">
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6`}>
                                    <step.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-gray-400">{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 text-center"
                >
                    <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:scale-105 transition-all inline-flex items-center gap-2">
                        Buy Now on Pump.fun
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
};
