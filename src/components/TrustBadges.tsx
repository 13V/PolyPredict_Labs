'use client';
import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, Users } from 'lucide-react';

export const TrustBadges = () => {
    const badges = [
        {
            icon: Shield,
            title: 'Audited Contract',
            description: 'Smart contract audited by leading security firms',
        },
        {
            icon: Lock,
            title: 'Liquidity Locked',
            description: '40% LP locked for 1 year on Pump.fun',
        },
        {
            icon: CheckCircle,
            title: 'Fair Launch',
            description: 'No presale, no team allocation, 100% fair',
        },
        {
            icon: Users,
            title: 'Community Driven',
            description: 'Governed by $POLYBET token holders',
        },
    ];

    return (
        <section className="py-12 px-6 bg-gradient-to-r from-purple-900/10 via-pink-900/10 to-purple-900/10 border-y border-gray-800">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {badges.map((badge, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="text-center"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-3">
                                <badge.icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-white font-bold mb-1">{badge.title}</h3>
                            <p className="text-gray-400 text-sm">{badge.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
