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
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[100]"
            >
                <div className="bg-white border-4 border-black p-5 neo-shadow group relative">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-3 right-3 p-1 text-black hover:bg-black hover:text-white transition-colors border border-black"
                    >
                        <X size={14} />
                    </button>

                    <div className="flex items-center gap-4 mb-5">
                        <div className="p-3 bg-black text-white border-2 border-black">
                            <Smartphone size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-black font-black text-base uppercase tracking-tighter italic">Install_Predict_Terminal</h3>
                            <p className="text-black/60 text-[10px] font-mono mt-1 font-bold uppercase">Ready_for_deployment_to_home_screen</p>
                        </div>
                    </div>

                    <button
                        onClick={handleInstallClick}
                        className="w-full py-3 bg-orange-600 text-white text-xs font-black uppercase tracking-widest border-2 border-black neo-shadow-sm hover:translate-y-[-2px] hover:neo-shadow active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={14} />
                        EXECUTE_INSTALLATION
                    </button>

                    <div className="mt-3 flex justify-between items-center text-[8px] font-mono text-black/40 font-bold uppercase">
                        <span>Terminal_ID: v0.2.0</span>
                        <span>Protocol: MAINNET_BETA</span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
