import React from 'react';
import './ConfirmModal.css'; // Usar el archivo CSS específico para este modal

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    <p>{children}</p>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="btn btn-danger">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
