import React, { useState, useEffect } from 'react';
import { productoService } from '../../services/productoService';
import type { Producto } from '../../pages/products';

interface StockAdjustmentModalProps {
    isOpen: boolean;            // Visibilidad
    onClose: () => void;        // Cerrar modal
    onSuccess: () => void;      // Callback éxito
    producto: Producto | null;  // Producto a ajustar
}

/**
 * Modal para ajuste rápido de inventario (Entradas/Salidas).
 * Permite incrementar o decrementar el stock actual de un producto.
 */
const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ isOpen, onClose, onSuccess, producto }) => {
    // Estado local para el stock temporal visualizado
    const [nuevoStock, setNuevoStock] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sincronizar stock inicial al abrir
    /* eslint-disable react-hooks/set-state-in-effect -- sincronización intencional del stock al abrir el modal */
    useEffect(() => {
        if (isOpen && producto) {
            setNuevoStock(producto.stockActual);
            setError(null);
        }
    }, [isOpen, producto]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (!isOpen || !producto) return null;

    // Handlers para botones +/-
    const handleIncrement = () => setNuevoStock((prev: number) => prev + 1);
    const handleDecrement = () => setNuevoStock((prev: number) => Math.max(0, prev - 1));

    // Envío del ajuste
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Calcular la diferencia neta
        const diferencia = nuevoStock - producto.stockActual;

        // Si no hubo cambios, solo cerrar
        if (diferencia === 0) {
            onClose();
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Determinar tipo de movimiento
            const movimiento = diferencia > 0 ? 'ENTRADA' : 'SALIDA';
            const cantidad = Math.abs(diferencia);

            // Llamada al servicio de ajuste
            await productoService.ajustarStock({
                idProducto: producto.idProducto!,
                cantidad: cantidad,
                movimiento: movimiento
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error adjusting stock:', err);
            setError('Error al ajustar el stock. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '12px',
                width: '90%', maxWidth: '400px',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="app-modal-title">Ajustar Stock</h2>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        style={{
                            background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
                            color: 'var(--text-secondary)'
                        }}
                    >&times;</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Producto: <strong>{producto.nombre}</strong>
                    </p>

                    {error && (
                        <div style={{
                            backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem',
                            borderRadius: '8px', border: '1px solid #fca5a5'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>

                        {/* Controles numéricos */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <button
                                type="button" onClick={handleDecrement}
                                style={{
                                    width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #D1D5DB',
                                    backgroundColor: '#F3F4F6', fontSize: '1.5rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
                                }}
                            >
                                -
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Stock Actual</span>
                                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{nuevoStock}</span>
                            </div>

                            <button
                                type="button" onClick={handleIncrement}
                                style={{
                                    width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #D1D5DB',
                                    backgroundColor: '#F3F4F6', fontSize: '1.5rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
                                }}
                            >
                                +
                            </button>
                        </div>

                        {/* Botones Acción */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', width: '100%' }}>
                            <button
                                type="button" onClick={onClose} disabled={loading}
                                className="btn btn-secondary" style={{ flex: 1 }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || nuevoStock === producto.stockActual}
                                className="btn btn-primary" style={{ flex: 1 }}
                            >
                                {loading ? 'Guardando...' : 'Guardar Ajuste'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;
