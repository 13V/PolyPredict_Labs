import { useCallback } from 'react';

type HapticType = 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' | 'selection';

export const useHaptic = () => {
    const trigger = useCallback((type: HapticType = 'light') => {
        if (typeof navigator === 'undefined' || !navigator.vibrate) return;

        switch (type) {
            case 'success':
                navigator.vibrate([10, 30, 10]);
                break;
            case 'warning':
                navigator.vibrate([30, 50, 10]);
                break;
            case 'error':
                navigator.vibrate([50, 50, 50]);
                break;
            case 'light':
                navigator.vibrate(5);
                break;
            case 'medium':
                navigator.vibrate(10);
                break;
            case 'heavy':
                navigator.vibrate(20);
                break;
            case 'selection':
                navigator.vibrate(2);
                break;
            default:
                navigator.vibrate(5);
        }
    }, []);

    return { trigger };
};
