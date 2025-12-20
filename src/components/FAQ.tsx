'use client';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
    {
        question: 'What is Polybet?',
        answer: 'Polybet is a prediction dApp where you vote on crypto market predictions using $POLYBET tokens. Correct predictions earn you rewards from the prize pool.',
    },
    {
        question: 'How do I buy $POLYBET tokens?',
        answer: 'After our fair launch on Pump.fun, you can buy $POLYBET by connecting your Solana wallet (Phantom/Solflare) and swapping SOL for $POLYBET on the platform.',
    },
    {
        question: 'What makes this different from other memecoins?',
        answer: 'Unlike pure memecoins, $POLYBET has real utility. You need tokens to vote on predictions, and accurate predictions earn rewards. Plus, we have deflationary tokenomics with a 1% burn on every transaction.',
    },
    {
        question: 'When is the launch?',
        answer: 'We\'re launching on Pump.fun soon! Join our Telegram and follow us on Twitter for the exact launch date announcement.',
    },
    {
        question: 'Is the liquidity locked?',
        answer: 'Yes! 40% of the supply goes to the liquidity pool, which will be locked for 1 year after launch. This prevents rug pulls and ensures long-term stability.',
    },
    {
        question: 'How do I earn rewards?',
        answer: 'Vote on predictions using your $POLYBET tokens. When a prediction closes, if you voted correctly, you receive a share of the rewards pool proportional to your vote.',
    },
];

export const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-20 px-6 bg-gray-900">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-xl text-gray-400">Everything you need to know</p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-xl border border-gray-800 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
                            >
                                <span className="text-lg font-semibold text-white">{faq.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-purple-400 transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {openIndex === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-6 pb-5"
                                >
                                    <p className="text-gray-400">{faq.answer}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
