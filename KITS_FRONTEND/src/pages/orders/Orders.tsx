import React, { useState, useEffect } from 'react';
import { pedidoService } from '../../services/pedidoService';
import type { Pedido, DetallePedido } from './';
import { OrderModal, ConfirmModal } from '../../components/modals';
// Importamos icono Truck para mostrar en los estados de entrega
import { Truck, Trash2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/ui/Toast';
import './Orders.css';

// Componente de página para gestión de Pedidos
const Orders: React.FC = () => {
    // Obtenemos el usuario y verificamos si es Repartidor para limitar acciones
    const user = authService.getCurrentUser();
    const isRepartidor = user?.idRol === 2; // ID 2 = Rol Repartidor

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


    // Estados para los filtros de búsqueda
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [filtroPagado, setFiltroPagado] = useState<string>('TODOS');
    const [filtroFecha, setFiltroFecha] = useState<string>('');
    const [filtroCliente, setFiltroCliente] = useState<string>('');
    const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
    const { toast, showToast, hideToast } = useToast();

    /**
     * Formatea una fecha a un string 'DD/MM/YYYY'.
     * Soluciona el problema de zona horaria al interpretar fechas 'YYYY-MM-DD' como UTC.
     * @param value La fecha a formatear (puede ser string, Date, etc.).
     * @returns La fecha formateada o 'N/A' si el valor no es válido.
     */
    const formatDate = (value?: string | number | null | Date): string => {
        if (value === null || value === undefined || value === '') return 'N/A';
        // Reemplazar guiones con slashes para que JS lo interprete como fecha local, no UTC.
        const date = new Date(String(value).replace(/-/g, '/'));
        if (isNaN(date.getTime())) return 'N/A';

        return date.toLocaleDateString('es-CR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

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

    // Función para actualizar el estado de un pedido (ej: Pendiente -> En Proceso)
    const handleUpdateStatus = async (pedidoId: number, nuevoEstado: string) => {
        try {
            await pedidoService.actualizarEstado(pedidoId, nuevoEstado);
            void loadPedidos(); // Recargar lista para reflejar cambios
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            showToast('Error al actualizar el estado del pedido', 'error');
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
                showToast('Error al eliminar el pedido', 'error');
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
                {/* Botón Nuevo Pedido: Oculto para Repartidores */}
                {!isRepartidor && (
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
                                                {formatDate(pedido.fechaPedido)}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Fecha Programada:</span>
                                            <span className="detail-value">
                                                {formatDate(pedido.fechaProgramada)}
                                            </span>
                                        </div>
                                    </div>

                                    {pedido.fechaEntrega && (
                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="detail-label">Fecha Entrega:</span>
                                                <span className="detail-value">
                                                    {formatDate(pedido.fechaEntrega)}
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
                                                                    ₡{detalle.precioUnitario.toFixed(2)}
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
                                        <strong>Total: ₡{pedido.total.toFixed(2)}</strong>
                                    </div>
                                </div>

                                <div className="order-footer">
                                    <div className="order-actions">
                                        {/* Botón Marcar Pagado: Visible si no está pagado y no es repartidor */}
                                        {!pedido.pagado && !isRepartidor && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleMarcarPagado(pedido.idPedido!)}
                                            >
                                                <span style={{ fontWeight: 'bold' }}>₡</span> Marcar Pagado
                                            </button>
                                        )}

                                        {/* Botones de Cambio de Estado: Disponibles para todos los roles con permisos */}
                                        {pedido.estado === 'PENDIENTE' && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleUpdateStatus(pedido.idPedido!, 'EN_PROCESO')}
                                            >
                                                Procesar
                                            </button>
                                        )}
                                        {pedido.estado === 'EN_PROCESO' && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleUpdateStatus(pedido.idPedido!, 'LISTO')}
                                            >
                                                Marcar Listo
                                            </button>
                                        )}
                                        {pedido.estado === 'LISTO' && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleUpdateStatus(pedido.idPedido!, 'ENTREGADO')}
                                            >
                                                Entregar
                                            </button>
                                        )}

                                        {/* Botón Editar:
                                            - Oculto si el estado es ENTREGADO
                                            - Oculto si el usuario es REPARTIDOR
                                            - Oculto si el pedido ya está PAGADO
                                        */}
                                        {pedido.estado !== 'ENTREGADO' && !isRepartidor && !pedido.pagado && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleEditOrder(pedido)}
                                            >
                                                Editar
                                            </button>
                                        )}

                                        {/* Botón Eliminar:
                                                - Oculto si el estado es ENTREGADO (ya se completó)
                                                - Oculto si el usuario es REPARTIDOR
                                            */}
                                        {pedido.estado !== 'ENTREGADO' && !isRepartidor && (
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
                ¿Estás seguro de que deseas eliminar este pedido? Esta acción restaurará el stock y no se puede deshacer.
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
