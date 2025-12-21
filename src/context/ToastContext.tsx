'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastOptions {
    id?: string;
}

interface ToastContextType {
    toast: {
        success: (msg: string, options?: ToastOptions) => string;
        error: (msg: string, options?: ToastOptions) => string;
        info: (msg: string, options?: ToastOptions) => string;
        loading: (msg: string, options?: ToastOptions) => string;
        dismiss: (id: string) => void;
    };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType, options?: ToastOptions) => {
        const id = options?.id || Math.random().toString(36).substring(7);

        setToasts((prev) => {
            const existing = prev.find(t => t.id === id);
            if (existing) {
                return prev.map(t => t.id === id ? { ...t, message, type } : t);
            }
            return [...prev, { id, message, type }];
        });

        // Auto remove non-loading toasts after 4 seconds
        if (type !== 'loading') {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4000);
        }

        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value = {
        toast: {
            success: (msg: string, options?: ToastOptions) => addToast(msg, 'success', options),
            error: (msg: string, options?: ToastOptions) => addToast(msg, 'error', options),
            info: (msg: string, options?: ToastOptions) => addToast(msg, 'info', options),
            loading: (msg: string, options?: ToastOptions) => addToast(msg, 'loading', options),
            dismiss: (id: string) => removeToast(id),
        },
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            layout
                            className={`
                                pointer-events-auto min-w-[320px] p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-4 transition-all
                                ${toast.type === 'success' ? 'bg-white border-black text-black' : ''}
                                ${toast.type === 'error' ? 'bg-white border-red-600 text-black' : ''}
                                ${toast.type === 'info' ? 'bg-white border-black text-black' : ''}
                                ${toast.type === 'loading' ? 'bg-black border-black text-white' : ''}
                            `}
                        >
                            <div className={`mt-0.5 shrink-0 ${toast.type === 'success' ? 'text-green-600' :
                                toast.type === 'error' ? 'text-red-600' :
                                    toast.type === 'loading' ? 'text-orange-600' : 'text-black'
                                }`}>
                                {toast.type === 'success' && <CheckCircle size={18} strokeWidth={3} />}
                                {toast.type === 'error' && <AlertCircle size={18} strokeWidth={3} />}
                                {toast.type === 'info' && <Info size={18} strokeWidth={3} />}
                                {toast.type === 'loading' && <Loader2 size={18} className="animate-spin" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 italic">
                                    {toast.type}_SIGNAL
                                </div>
                                <p className="text-[11px] font-mono font-bold leading-tight uppercase tracking-tight">
                                    {toast.message}
                                </p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className={`ml-2 shrink-0 p-1 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black ${toast.type === 'loading' ? 'text-white/50' : 'text-black/50'}`}
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context.toast;
};
