import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={20} />;
            case 'error': return <XCircle size={20} />;
            case 'warning': return <AlertTriangle size={20} />;
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'success': return { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' };
            case 'error': return { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' };
            case 'warning': return { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' };
        }
    };

    const style = getStyles();

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`,
            padding: '16px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 9999,
            animation: 'slideIn 0.3s ease-out',
            maxWidth: '400px',
            fontWeight: 500
        }}>
            <style>
                {`
                    @keyframes slideIn {
                        from { transform: translateY(100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {getIcon()}
            </div>
            <div style={{ flex: 1 }}>{message}</div>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'currentColor',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    opacity: 0.7
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
