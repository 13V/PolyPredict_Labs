'use client';
import { motion } from 'framer-motion';
import { Coins, Lock, TrendingUp, Users } from 'lucide-react';

export const Tokenomics = () => {
    const distribution = [
        { label: 'Liquidity Pool', percentage: 40, color: 'bg-blue-500' },
        { label: 'Fair Launch', percentage: 30, color: 'bg-purple-500' },
        { label: 'Rewards Pool', percentage: 20, color: 'bg-green-500' },
        { label: 'Marketing', percentage: 10, color: 'bg-pink-500' },
    ];

    const features = [
        {
            icon: Coins,
            title: 'Vote to Earn',
            description: 'Hold tokens to vote on predictions. Correct predictions earn rewards.',
        },
        {
            icon: Lock,
            title: 'Deflationary',
            description: '1% of every transaction is burned, reducing supply over time.',
        },
        {
            icon: TrendingUp,
            title: 'Staking Rewards',
            description: 'Stake your tokens to earn passive income from the rewards pool.',
        },
        {
            icon: Users,
            title: 'Community Governed',
            description: 'Token holders vote on new features and platform decisions.',
        },
    ];

    return (
        <section className="py-20 px-6 bg-gray-950 border-t border-gray-800">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Tokenomics
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        $PROPHET is designed for long-term value with deflationary mechanics and real utility.
                    </p>
                </motion.div>

                {/* Token Details */}
                <div className="grid md:grid-cols-2 gap-12 mb-16">
                    {/* Distribution Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-8 border border-gray-800"
                    >
                        <h3 className="text-2xl font-bold mb-6 text-white">Token Distribution</h3>
                        <div className="space-y-4">
                            {distribution.map((item, index) => (
                                <div key={index}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-300">{item.label}</span>
                                        <span className="text-white font-bold">{item.percentage}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${item.percentage}%` }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1, duration: 0.8 }}
                                            className={`h-full ${item.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-800">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-gray-400 text-sm">Total Supply</p>
                                    <p className="text-2xl font-bold text-white">1B</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Burn Rate</p>
                                    <p className="text-2xl font-bold text-purple-400">1%</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Features Grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-all"
                            >
                                <feature.icon className="w-8 h-8 text-purple-400 mb-3" />
                                <h4 className="text-white font-bold mb-2">{feature.title}</h4>
                                <p className="text-gray-400 text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
