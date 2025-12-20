'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Download, X } from 'lucide-react';

export const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // Only show if not already installed and on mobile/desktop that supports PWA
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) {
                // Delay showing to not annoy user immediately
                setTimeout(() => setIsVisible(true), 5000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[100]"
            >
                <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-2xl shadow-purple-500/20 backdrop-blur-xl group">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                            <Smartphone size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-sm">Install Polybet App</h3>
                            <p className="text-slate-400 text-xs mt-0.5">Add to home screen for the full experience.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleInstallClick}
                        className="w-full mt-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2"
                    >
                        <Download size={14} />
                        Install Now
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
