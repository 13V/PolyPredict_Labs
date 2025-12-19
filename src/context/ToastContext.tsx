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
                                pointer-events-auto min-w-[300px] p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-3
                                ${toast.type === 'success' ? 'bg-gray-900/90 border-green-500/30 text-green-100' : ''}
                                ${toast.type === 'error' ? 'bg-gray-900/90 border-red-500/30 text-red-100' : ''}
                                ${toast.type === 'info' ? 'bg-gray-900/90 border-blue-500/30 text-blue-100' : ''}
                                ${toast.type === 'loading' ? 'bg-gray-900/90 border-purple-500/30 text-purple-100' : ''}
                            `}
                        >
                            <div className={`mt-0.5 shrink-0 ${toast.type === 'success' ? 'text-green-500' :
                                toast.type === 'error' ? 'text-red-500' :
                                    toast.type === 'loading' ? 'text-purple-500' : 'text-blue-500'
                                }`}>
                                {toast.type === 'success' && <CheckCircle size={18} />}
                                {toast.type === 'error' && <AlertCircle size={18} />}
                                {toast.type === 'info' && <Info size={18} />}
                                {toast.type === 'loading' && <Loader2 size={18} className="animate-spin" />}
                            </div>
                            <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-auto text-white/50 hover:text-white transition-colors"
                            >
                                <X size={16} />
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
