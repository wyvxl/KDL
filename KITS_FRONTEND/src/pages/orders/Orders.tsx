import React, { useState, useEffect } from 'react';
import { pedidoService } from '../../services/pedidoService';
import type { Pedido, DetallePedido } from './';
import { OrderModal, ConfirmModal } from '../../components/modals';
// Importamos icono Truck para mostrar en los estados de entrega
import { Truck, Trash2 } from 'lucide-react';
import { PERMISOS, tienePermiso } from '../../utils/permisos';
import { mensajeDeError } from '../../utils/errorHandler';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/ui/Toast';
import './Orders.css';
import { formatoFecha, formatoMoneda } from '../../utils/formato';

// Componente de página para gestión de Pedidos
const Orders: React.FC = () => {
    // Qué puede hacer el usuario se decide por permisos, no por id de rol:
    // el vendedor toma y cobra pedidos, cocina y reparto los avanzan de estado.
    const puedeGestionar = tienePermiso(PERMISOS.GESTIONAR_PEDIDOS);
    const puedeAvanzar = tienePermiso(PERMISOS.AVANZAR_PEDIDOS);

    // Estados para almacenar datos, carga, errores y control de UI
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [pedidoDetalles, setPedidoDetalles] = useState<Record<number, DetallePedido[]>>({});
    const [loadingDetalles, setLoadingDetalles] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Pedido | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);


    // Estados para los filtros de búsqueda
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [filtroPagado, setFiltroPagado] = useState<string>('TODOS');
    const [filtroFecha, setFiltroFecha] = useState<string>('');
    const [filtroCliente, setFiltroCliente] = useState<string>('');
    const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
    const { toast, showToast, hideToast } = useToast();

    // Función asíncrona para obtener la lista de pedidos desde el backend
    const loadPedidos = async () => {
        try {
            setLoading(true);
            const data = await pedidoService.listar();
            setPedidos(data);
            // No cargar detalles automáticamente - usar lazy loading
        } catch (err) {
            console.error('Error al cargar pedidos:', err);
            setError('No se pudieron cargar los pedidos. Verifique la conexión con el backend.');
        } finally {
            setLoading(false);
        }
    };

    // Función para cargar detalles de un pedido específico (lazy loading)
    const loadPedidoDetalles = async (pedidoId: number) => {
        // Si ya están cargados o se están cargando, no hacer nada
        if (pedidoDetalles[pedidoId] || loadingDetalles[pedidoId]) {
            return;
        }

        try {
            setLoadingDetalles(prev => ({ ...prev, [pedidoId]: true }));
            const detalles = await pedidoService.listarDetalles(pedidoId);
            setPedidoDetalles(prev => ({ ...prev, [pedidoId]: detalles }));
        } catch (err) {
            console.error(`Error al cargar detalles del pedido ${pedidoId}:`, err);
            setPedidoDetalles(prev => ({ ...prev, [pedidoId]: [] }));
        } finally {
            setLoadingDetalles(prev => ({ ...prev, [pedidoId]: false }));
        }
    };

    // Cargar pedidos al iniciar el componente
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar (loadPedidos gestiona el estado de carga)
        void loadPedidos();
    }, []);

    // Cargar detalles automáticamente cuando se cargan los pedidos
    useEffect(() => {
        if (pedidos.length > 0) {
            pedidos.forEach(pedido => {
                if (pedido.idPedido && !pedidoDetalles[pedido.idPedido] && !loadingDetalles[pedido.idPedido]) {
                    void loadPedidoDetalles(pedido.idPedido);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- se recarga intencionalmente al cambiar la lista de pedidos
    }, [pedidos]);

    // Abre el modal para crear un NUEVO pedido
    const handleNewOrder = () => {
        setEditingOrder(null); // Null indica modo creación
        setShowModal(true);
    };

    // Abre el modal para EDITAR un pedido existente
    const handleEditOrder = (pedido: Pedido) => {
        setEditingOrder(pedido);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOrder(null);
    };

    // Callback para refrescar la lista después de crear/editar un pedido
    const handleOrderAdded = () => {
        setPedidoDetalles({}); // Limpiar caché de detalles para forzar recarga (por si hubo cambios en productos)
        void loadPedidos();
    };

    /**
     * Avanza el estado de un pedido (ej: Pendiente -> En Proceso).
     *
     * Al pasar a EN_PROCESO el backend descuenta el stock de los productos: es el
     * momento en que salen del inventario. Si no alcanza, el cambio se rechaza y aquí
     * se muestra qué producto faltó.
     *
     * El backend registra al usuario de la sesión como responsable, tomándolo del token.
     */
    const handleUpdateStatus = async (pedidoId: number, nuevoEstado: string) => {
        try {
            await pedidoService.actualizarEstado(pedidoId, nuevoEstado);
            void loadPedidos(); // Recargar lista para reflejar cambios
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            showToast(mensajeDeError(error, 'Error al actualizar el estado del pedido'), 'error');
        }
    };

    // Abre el modal de confirmación para cancelar un pedido
    const handleCancelOrder = (pedidoId: number) => {
        setCancelingOrderId(pedidoId);
        setShowCancelModal(true);
    };

    /**
     * Cancela el pedido. Si cocina ya lo había tomado, el backend devuelve sus
     * productos al inventario.
     */
    const confirmCancel = async () => {
        if (!cancelingOrderId) return;
        try {
            await pedidoService.actualizarEstado(cancelingOrderId, 'CANCELADO');
            void loadPedidos();
            showToast('Pedido cancelado. El stock reservado volvió al inventario.', 'success');
        } catch (error) {
            console.error('Error al cancelar pedido:', error);
            showToast(mensajeDeError(error, 'Error al cancelar el pedido'), 'error');
        } finally {
            setShowCancelModal(false);
            setCancelingOrderId(null);
        }
    };

    // Función para marcar un pedido como pagado
    const handleMarcarPagado = async (pedidoId: number) => {
        try {
            await pedidoService.marcarPagado(pedidoId);
            void loadPedidos(); // Recargar lista para reflejar cambios
            showToast('Pedido marcado como pagado exitosamente', 'success');
        } catch (error) {
            console.error('Error al marcar como pagado:', error);
            showToast('Error al marcar el pedido como pagado', 'error');
        }
    };


    // Abre el modal de confirmación para eliminar un pedido
    const handleDeleteOrder = (pedidoId: number) => {
        setDeletingOrderId(pedidoId);
        setShowConfirmModal(true);
    };

    // Se ejecuta al confirmar la eliminación en el modal
    const confirmDelete = async () => {
        if (deletingOrderId) {
            try {
                await pedidoService.eliminar(deletingOrderId);
                void loadPedidos(); // Recargar lista para reflejar cambios
                showToast('Pedido eliminado exitosamente', 'success');
            } catch (error) {
                console.error('Error al eliminar pedido:', error);
                showToast(mensajeDeError(error, 'Error al eliminar el pedido'), 'error');
            } finally {
                setShowConfirmModal(false);
                setDeletingOrderId(null);
            }
        }
    };



    // Lógica de filtrado y ordenamiento de pedidos
    const getPedidosFiltrados = () => {
        let pedidosFiltrados = [...pedidos];

        // 1. Filtrar por estado
        if (filtroEstado !== 'TODOS') {
            pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === filtroEstado);
        }

        // 2. Filtrar por estado de pago
        if (filtroPagado !== 'TODOS') {
            pedidosFiltrados = pedidosFiltrados.filter(p => {
                if (filtroPagado === 'PAGADO') return p.pagado === true;
                if (filtroPagado === 'NO_PAGADO') return !p.pagado;
                return true;
            });
        }

        // 3. Filtrar por fecha programada (comparación de calendario sin zonas)
        if (filtroFecha) {
            pedidosFiltrados = pedidosFiltrados.filter(p => {
                const fechaProg = p.fechaProgramada || '';
                return fechaProg === filtroFecha;
            });
        }

        // 4. Filtrar por nombre de cliente
        if (filtroCliente.trim()) {
            pedidosFiltrados = pedidosFiltrados.filter(p =>
                p.cliente?.nombre?.toLowerCase().includes(filtroCliente.toLowerCase())
            );
        }

        // 5. Ordenar resultados: ENTREGADOS al final, el resto por fecha ascendente (comparación lexicográfica YYYY-MM-DD)
        pedidosFiltrados.sort((a, b) => {
            // Prioridad baja a ENTREGADOS
            if (a.estado === 'ENTREGADO' && b.estado !== 'ENTREGADO') return 1;
            if (a.estado !== 'ENTREGADO' && b.estado === 'ENTREGADO') return -1;

            // Orden por fecha programada (más próxima primero) usando cadenas 'YYYY-MM-DD'
            const fa = (a.fechaProgramada || '');
            const fb = (b.fechaProgramada || '');
            return fa.localeCompare(fb);
        });

        return pedidosFiltrados;
    };

    if (loading) return <div>Cargando pedidos...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="orders-page">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>Pedidos</h1>
                    {/* Botón para mostrar/ocultar panel de filtros */}
                    <button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className="btn btn-secondary"
                        style={{
                            padding: '0.5rem',
                            minWidth: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Buscar/Filtrar pedidos"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                </div>
                {/* Botón Nuevo Pedido: solo quien toma pedidos (vendedor/admin) */}
                {puedeGestionar && (
                    <button
                        className="btn btn-primary"
                        onClick={handleNewOrder}
                    >
                        + Nuevo Pedido
                    </button>
                )}
            </div>

            {/* Panel de Filtros (Renderizado condicional) */}
            {mostrarFiltros && (
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: 'var(--color-bg-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Filtrar por Estado
                        </label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="TODOS">Todos</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="EN_PROCESO">En Proceso</option>
                            <option value="LISTO">Listo</option>
                            <option value="ENTREGADO">Entregado</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Filtrar por Pago
                        </label>
                        <select
                            value={filtroPagado}
                            onChange={(e) => setFiltroPagado(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="TODOS">Todos</option>
                            <option value="PAGADO">Pagado</option>
                            <option value="NO_PAGADO">No Pagado</option>
                        </select>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Filtrar por Fecha Programada
                        </label>
                        <input
                            type="date"
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'white'
                            }}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Buscar por Cliente
                        </label>
                        <input
                            type="text"
                            placeholder="Nombre del cliente..."
                            value={filtroCliente}
                            onChange={(e) => setFiltroCliente(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'white'
                            }}
                        />
                    </div>

                    {/* Botón Reset filtros */}
                    {(filtroEstado !== 'TODOS' || filtroPagado !== 'TODOS' || filtroFecha || filtroCliente) && (
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setFiltroEstado('TODOS');
                                    setFiltroPagado('TODOS');
                                    setFiltroFecha('');
                                    setFiltroCliente('');
                                }}
                                className="btn btn-secondary"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="orders-grid">
                {getPedidosFiltrados().length === 0 ? (
                    <p className="empty-state">No hay pedidos que coincidan con los filtros.</p>
                ) : (
                    <div className="orders-list">
                        {getPedidosFiltrados().map((pedido) => (
                            <div key={pedido.idPedido} className="order-card">
                                <div className="order-header">
                                    <div className="order-title">
                                        <h3>Pedido #{pedido.idPedido}</h3>
                                        {/* Insignia de PAGADO con icono de Colones */}
                                        {pedido.pagado && (
                                            <span className="payment-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ fontWeight: 'bold' }}>₡</span>
                                                Pagado
                                            </span>
                                        )}
                                    </div>
                                    {/* Indicador de Estado del pedido + Icono Truck */}
                                    <span
                                        className={`status status-${pedido.estado.toLowerCase().replace('_', '-')}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Truck size={16} />
                                        {pedido.estado.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="order-details">
                                    <div className="detail-row">
                                        <div className="detail-item">
                                            <span className="detail-label">Cliente:</span>
                                            <span className="detail-value">{pedido.cliente?.nombre || `ID: ${pedido.cliente?.idCliente}`}</span>
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <div className="detail-item">
                                            <span className="detail-label">Fecha Creación:</span>
                                            <span className="detail-value">
                                                {formatoFecha(pedido.fechaPedido)}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Fecha Programada:</span>
                                            <span className="detail-value">
                                                {formatoFecha(pedido.fechaProgramada)}
                                            </span>
                                        </div>
                                    </div>

                                    {pedido.fechaEntrega && (
                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="detail-label">Fecha Entrega:</span>
                                                <span className="detail-value">
                                                    {formatoFecha(pedido.fechaEntrega)}
                                                </span>
                                            </div>
                                        </div>
                                    )}



                                    {/* Sección de visualización de productos incluidos */}
                                    {pedido.idPedido && (
                                        <div className="detail-row full-width">
                                            <div className="detail-item">
                                                <span className="detail-label">Productos:</span>
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    {loadingDetalles[pedido.idPedido] ? (
                                                        <div style={{
                                                            padding: '0.75rem',
                                                            backgroundColor: 'var(--color-bg-card)',
                                                            borderRadius: '4px',
                                                            color: 'var(--text-secondary)',
                                                            textAlign: 'center',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            Cargando productos...
                                                        </div>
                                                    ) : pedidoDetalles[pedido.idPedido] && pedidoDetalles[pedido.idPedido].length > 0 ? (
                                                        pedidoDetalles[pedido.idPedido].map((detalle, index) => (
                                                            <div
                                                                key={index}
                                                                style={{
                                                                    padding: '0.5rem',
                                                                    marginBottom: '0.25rem',
                                                                    borderRadius: '4px',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <span style={{ flex: 1 }}>
                                                                    {detalle.producto.nombre || `Producto #${detalle.producto.idProducto}`}
                                                                </span>
                                                                <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
                                                                    Cant: {detalle.cantidad}
                                                                </span>
                                                                <span style={{ marginLeft: '1rem', fontWeight: 'bold' }}>
                                                                    {formatoMoneda(detalle.precioUnitario)}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div style={{
                                                            padding: '0.75rem',
                                                            backgroundColor: 'var(--color-bg-card)',
                                                            borderRadius: '4px',
                                                            color: 'var(--text-secondary)',
                                                            textAlign: 'center',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            No hay productos en este pedido
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="order-total">
                                        <strong>Total: {formatoMoneda(pedido.total)}</strong>
                                    </div>
                                </div>

                                <div className="order-footer">
                                    <div className="order-actions">
                                        {/* Cobrar: lo hace quien atiende al cliente */}
                                        {!pedido.pagado && pedido.estado !== 'CANCELADO' && puedeGestionar && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleMarcarPagado(pedido.idPedido!)}
                                            >
                                                <span style={{ fontWeight: 'bold' }}>₡</span> Marcar Pagado
                                            </button>
                                        )}

                                        {/* Avance de estado: cocina y reparto.
                                            "Procesar" es el momento en que los productos salen del
                                            inventario, sin importar para qué día sea el pedido. */}
                                        {puedeAvanzar && pedido.estado === 'PENDIENTE' && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleUpdateStatus(pedido.idPedido!, 'EN_PROCESO')}
                                                title="Cocina toma el pedido y descuenta el stock"
                                            >
                                                Procesar
                                            </button>
                                        )}
                                        {puedeAvanzar && pedido.estado === 'EN_PROCESO' && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleUpdateStatus(pedido.idPedido!, 'LISTO')}
                                            >
                                                Marcar Listo
                                            </button>
                                        )}
                                        {puedeAvanzar && pedido.estado === 'LISTO' && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleUpdateStatus(pedido.idPedido!, 'ENTREGADO')}
                                            >
                                                Entregar
                                            </button>
                                        )}

                                        {/* Editar: solo mientras siga PENDIENTE. Después sus productos ya
                                            salieron del inventario y cambiar las líneas descuadraría el stock
                                            (el backend lo rechaza con ORA-20003). */}
                                        {pedido.estado === 'PENDIENTE' && puedeGestionar && !pedido.pagado && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleEditOrder(pedido)}
                                            >
                                                Editar
                                            </button>
                                        )}

                                        {/* Cancelar: conserva el pedido en el historial y devuelve al
                                            inventario lo que cocina ya hubiera tomado. */}
                                        {pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO' && puedeGestionar && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleCancelOrder(pedido.idPedido!)}
                                                title="Cancelar Pedido"
                                            >
                                                Cancelar
                                            </button>
                                        )}

                                        {/* Eliminar: borra el pedido del sistema. Para el día a día se
                                            prefiere Cancelar, que deja rastro. */}
                                        {pedido.estado !== 'ENTREGADO' && puedeGestionar && (
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleDeleteOrder(pedido.idPedido!)}
                                                title="Eliminar Pedido"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal para Crear/Editar (Reutilizable) */}
            <OrderModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onOrderAdded={handleOrderAdded}
                order={editingOrder}
            />

            {/* Modal de Confirmación para Eliminar */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
            >
                ¿Estás seguro de que deseas eliminar este pedido? Se devolverá al inventario el stock
                que cocina ya hubiera tomado y no se puede deshacer. Si solo querés anularlo dejando
                el registro, usá "Cancelar".
            </ConfirmModal>

            {/* Modal de Confirmación para Cancelar */}
            <ConfirmModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancel}
                title="Confirmar Cancelación"
            >
                ¿Cancelar este pedido? Queda registrado como CANCELADO y, si cocina ya lo había
                tomado, sus productos vuelven al inventario.
            </ConfirmModal>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}
        </div>
    );
};

export default Orders;
