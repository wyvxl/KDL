import { useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastState {
    message: string;
    type: ToastType;
}

export const useToast = () => {
    const [toast, setToast] = useState<ToastState | null>(null);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    return { toast, showToast, hideToast };
};
