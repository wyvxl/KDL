import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    AlertTriangle,
    Plus,
    Users,
    Package,
    FileText,
    Loader2,
    X,
    Truck,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    ChefHat,
    type LucideIcon
} from 'lucide-react';
import { pedidoService } from '../../services/pedidoService';
import { productoService } from '../../services/productoService';
import { authService } from '../../services/authService';
import { PERMISOS, tienePermiso } from '../../utils/permisos';
import { aDiaLocal } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errorHandler';
import type { Pedido, DetallePedido, ProduccionRequerida } from '../orders';
import type { Producto } from '../products';
import './Dashboard.css';
import Toast, { type ToastType } from '../../components/ui/Toast';
import { formatoFecha, formatoMoneda } from '../../utils/formato';

/** Un pedido cancelado ya no es trabajo pendiente: no cuenta como atrasado ni en la agenda. */
const estaActivo = (pedido: Pedido) => pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO';

/**
 * Flujo de estados del pedido, el mismo que usa la pantalla de Pedidos.
 * Pasar a EN_PROCESO es lo que descuenta el stock: es cuando cocina toma el pedido.
 */
const SIGUIENTE_ESTADO: Record<string, { estado: string; etiqueta: string; exito: string }> = {
    PENDIENTE: { estado: 'EN_PROCESO', etiqueta: 'Procesar', exito: 'Pedido en proceso' },
    EN_PROCESO: { estado: 'LISTO', etiqueta: 'Marcar Listo', exito: 'Pedido listo para entregar' },
    LISTO: { estado: 'ENTREGADO', etiqueta: 'Entregar', exito: 'Pedido entregado exitosamente' },
};

const COLOR_ESTADO: Record<string, string> = {
    EN_PROCESO: '#3b82f6',
    LISTO: '#f59e0b',
    ENTREGADO: '#8b5cf6',
};

// KPI Card: componente presentacional puro, definido a nivel de módulo (no dentro del render).
const KPICard = ({ title, value, icon: Icon, variant }: { title: string; value: number; icon: LucideIcon; variant: string }) => (
    <div className="kpi-card">
        <div className={`kpi-icon kpi-${variant}`}>
            <Icon size={28} />
        </div>
        <div className="kpi-content">
            <span className="kpi-label">{title}</span>
            <span className="kpi-value">{value}</span>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        pedidosHoy: Pedido[];
        atrasados: Pedido[];
        pendientes: Pedido[];
        entregados: Pedido[];
        stockBajo: Producto[];
        produccion: ProduccionRequerida[];
    }>({
        pedidosHoy: [],
        atrasados: [],
        pendientes: [],
        entregados: [],
        stockBajo: [],
        produccion: []
    });

    const [detalles, setDetalles] = useState<Record<number, DetallePedido[]>>({});
    const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
    };

    /**
     * Avanza un pedido al siguiente estado y refleja el cambio en las listas locales.
     *
     * Al pasar a EN_PROCESO el backend descuenta el stock. Si no alcanza, rechaza el
     * cambio y aquí se muestra qué producto faltó.
     */
    const avanzarEstado = async (pedido: Pedido, siguiente: { estado: string; exito: string }) => {
        try {
            const usuarioActual = authService.getCurrentUser();
            await pedidoService.actualizarEstado(pedido.idPedido!, siguiente.estado);

            // El backend deja el pedido a nombre del usuario de la sesión; se refleja
            // aquí también para que la UI lo muestre al instante sin recargar.
            const actualizado: Pedido = {
                ...pedido,
                estado: siguiente.estado,
                usuarioResponsable: {
                    ...pedido.usuarioResponsable,
                    idUsuario: usuarioActual?.idUsuario ?? 0,
                    nombreCompleto: usuarioActual?.nombreCompleto ?? 'Usuario',
                    nombreUsuario: usuarioActual?.nombreUsuario,
                    email: usuarioActual?.email
                }
            };
            setSelectedOrder(actualizado);

            setData(prev => {
                if (siguiente.estado !== 'ENTREGADO') {
                    // Sigue en la agenda, solo cambia cómo se muestra.
                    const reemplazar = (lista: Pedido[]) =>
                        lista.map(p => p.idPedido === actualizado.idPedido ? actualizado : p);
                    return {
                        ...prev,
                        pedidosHoy: reemplazar(prev.pedidosHoy),
                        atrasados: reemplazar(prev.atrasados),
                        pendientes: reemplazar(prev.pendientes)
                    };
                }
                // Al entregar sale de la agenda y pasa a finalizados.
                const quitar = (lista: Pedido[]) => lista.filter(p => p.idPedido !== actualizado.idPedido);
                return {
                    ...prev,
                    pedidosHoy: quitar(prev.pedidosHoy),
                    atrasados: quitar(prev.atrasados),
                    pendientes: quitar(prev.pendientes),
                    entregados: [...prev.entregados, actualizado]
                };
            });

            showToast(siguiente.exito, 'success');
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            showToast(mensajeDeError(error, 'Error al actualizar el estado del pedido'), 'error');
        }
    };

    const hasPermission = tienePermiso;
    const puedeGestionar = tienePermiso(PERMISOS.GESTIONAR_PEDIDOS);
    const puedeAvanzar = tienePermiso(PERMISOS.AVANZAR_PEDIDOS);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const promises: Promise<unknown>[] = [];
                if (hasPermission('VER_PEDIDOS')) promises.push(pedidoService.listar());
                else promises.push(Promise.resolve([]));

                if (hasPermission('VER_PRODUCTOS')) promises.push(productoService.listar());
                else promises.push(Promise.resolve([]));

                const [pedidos, productos] = await Promise.all(promises);

                const todayStr = aDiaLocal(new Date());

                let pedidosHoyList: Pedido[] = [];
                let atrasadosList: Pedido[] = [];
                let pendientesList: Pedido[] = [];
                let entregadosList: Pedido[] = [];
                let stockBajoList: Producto[] = [];

                if (pedidos) {
                    pedidosHoyList = (pedidos as Pedido[]).filter(p => {
                        const pDateStr = aDiaLocal(p.fechaProgramada);
                        return pDateStr === todayStr && estaActivo(p);
                    });

                    atrasadosList = (pedidos as Pedido[]).filter(p => {
                        const pDateStr = aDiaLocal(p.fechaProgramada);
                        return pDateStr && pDateStr < todayStr && estaActivo(p);
                    });

                    pendientesList = (pedidos as Pedido[]).filter(p => p.estado === 'PENDIENTE');

                    entregadosList = (pedidos as Pedido[]).filter(p => {
                        if (p.estado !== 'ENTREGADO') return false;
                        const pDateStr = aDiaLocal(p.fechaEntrega) || aDiaLocal(p.fechaProgramada);
                        return pDateStr === todayStr;
                    });
                }

                // Sorting
                const sortOrders = (a: Pedido, b: Pedido) => {
                    const fechaA = new Date(a.fechaProgramada).getTime();
                    const fechaB = new Date(b.fechaProgramada).getTime();
                    return fechaA - fechaB;
                };
                pedidosHoyList.sort(sortOrders);
                atrasadosList.sort(sortOrders);

                if (productos) {
                    stockBajoList = (productos as Producto[]).filter(p => {
                        const actual = Number(p.stockActual);
                        const min = Number(p.stockMinimo);
                        return !isNaN(actual) && !isNaN(min) && actual <= min;
                    });
                }

                // Parte de producción del día: qué tiene que hornear cocina.
                let produccionList: ProduccionRequerida[] = [];
                if (hasPermission(PERMISOS.VER_PRODUCCION)) {
                    try {
                        produccionList = await pedidoService.produccion(todayStr);
                    } catch (err) {
                        console.error('Error cargando el parte de producción:', err);
                    }
                }

                setData({
                    pedidosHoy: pedidosHoyList,
                    atrasados: atrasadosList,
                    pendientes: pendientesList,
                    entregados: entregadosList,
                    stockBajo: stockBajoList,
                    produccion: produccionList
                });

                if (hasPermission('VER_PEDIDOS')) {
                    const ordersToFetch = [...pedidosHoyList, ...atrasadosList, ...entregadosList];
                    const uniqueOrderIds = [...new Set(ordersToFetch.map(p => p.idPedido).filter((id): id is number => id !== null))];
                    const detallesMap: Record<number, DetallePedido[]> = {};
                    await Promise.all(uniqueOrderIds.map(async (id) => {
                        try {
                            detallesMap[id] = await pedidoService.listarDetalles(id);
                        } catch (err) { console.error(err); }
                    }));
                    setDetalles(detallesMap);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- carga única al montar
    }, []);

    if (loading) {
        return (
            <div className="dashboard flex-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={48} color="#667eea" />
            </div>
        );
    }

    const formatEstado = (estado: string) => {
        return estado.replace('_', ' ').toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // --- RENDER HELPERS ---

    // Agenda Item Component
    const AgendaItem = ({ order, isLate }: { order: Pedido, isLate: boolean }) => {
        const isFinished = order.estado === 'ENTREGADO';
        // Determinar clase base
        let itemClass = 'today';
        if (isFinished) itemClass = 'finished';
        else if (isLate) itemClass = 'critical';

        return (
            <div
                className={`agenda-item ${itemClass}`}
                onClick={() => setSelectedOrder(order)}
                style={{ cursor: 'pointer' }}
            >
                <div className="agenda-time">
                    <span className="time-val">
                        {order.fechaProgramada ? formatoFecha(order.fechaProgramada, { conAnio: false }) : '--/--'}
                    </span>
                    <span className="date-val">
                        {isFinished ? 'LISTO' : (isLate ? 'ATRASADO' : 'HOY')}
                    </span>
                </div>
                <div className="agenda-details">
                    <div className="agenda-title">
                        {order.cliente?.nombre ?? 'Cliente no asignado'} #{order.idPedido}
                    </div>
                    <div className="agenda-subtitle">
                        {detalles[order.idPedido!] ? (
                            <span>
                                {detalles[order.idPedido!].length} productos
                                {order.pagado && <span style={{ marginLeft: '8px', color: '#10b981', fontWeight: 700 }}>• PAGADO</span>}
                            </span>
                        ) : 'Cargando...'}
                    </div>
                </div>
                <div className="agenda-status-wrapper">
                    <span className={`agenda-status ${isFinished ? 'st-finished' : (order.estado === 'PENDIENTE' ? 'st-pending' : 'st-process')}`}>
                        {formatEstado(order.estado)}
                    </span>
                </div>
                <div className="agenda-action">
                    <ArrowRight size={18} color="#94a3b8" />
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard">


            {/* KPI GRID */}
            {hasPermission('VER_PEDIDOS') && (
                <div className="kpi-grid">
                    <KPICard title="Pedidos Atrasados" value={data.atrasados.length} icon={AlertCircle} variant="danger" />
                    <KPICard title="Pedidos de Hoy" value={data.pedidosHoy.length} icon={Calendar} variant="primary" />
                    <KPICard title="Total Pendientes" value={data.pendientes.length} icon={Clock} variant="warning" />
                    {hasPermission('VER_PRODUCTOS') && (
                        <KPICard title="Alertas de Stock" value={data.stockBajo.length} icon={AlertTriangle} variant="info" />
                    )}
                </div>
            )}

            <div className="main-grid">
                {/* LEFT COLUMN: AGENDA */}
                <div className="agenda-section">
                    <div className="section-header">
                        <h2><FileText size={20} /> Agenda del Día</h2>
                    </div>

                    <div className="agenda-list">
                        {/* 1. ATRASADOS */}
                        {data.atrasados.map(order => (
                            <AgendaItem key={order.idPedido} order={order} isLate={true} />
                        ))}

                        {/* 2. HOY */}
                        {data.pedidosHoy.map(order => (
                            <AgendaItem key={order.idPedido} order={order} isLate={false} />
                        ))}

                        {data.atrasados.length === 0 && data.pedidosHoy.length === 0 && (
                            <div className="empty-state-modern">
                                <CheckCircle2 size={40} style={{ marginBottom: '10px', color: '#cbd5e1' }} />
                                <p>¡Todo al día! No hay pedidos pendientes para hoy.</p>
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN FINALIZADOS */}
                    {data.entregados.length > 0 && (
                        <div className="section-header" style={{ marginTop: '2rem' }}>
                            <h2><CheckCircle2 size={20} color="#10b981" /> Finalizados Hoy</h2>
                        </div>
                    )}
                    <div className="agenda-list">
                        {data.entregados.map(order => (
                            <AgendaItem key={order.idPedido} order={order} isLate={false} />
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: SIDE PANEL */}
                <div className="side-panel">

                    {/* PARTE DE PRODUCCIÓN (cocina): qué hay que hornear hoy */}
                    {hasPermission(PERMISOS.VER_PRODUCCION) && (
                        <div className="alerts-box">
                            <div className="section-header">
                                <h2><ChefHat size={20} /> Producción de Hoy</h2>
                            </div>
                            {data.produccion.length > 0 ? (
                                <div className="stock-list">
                                    {data.produccion.map(linea => (
                                        <div key={linea.idProducto} className="stock-item">
                                            <span style={{ fontWeight: 600 }}>{linea.nombre}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>
                                                {linea.faltante > 0 ? (
                                                    <span style={{ color: '#dc2626' }} title="Falta hornear">
                                                        faltan {linea.faltante}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#10b981' }} title="Alcanza con el stock actual">
                                                        {linea.porPreparar > 0 ? `${linea.porPreparar} por alistar` : 'al día'}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                                    Nada programado para hoy
                                </div>
                            )}
                        </div>
                    )}

                    {/* ACCIONES RÁPIDAS */}
                    <div className="actions-box">
                        <div className="section-header">
                            <h2>Acciones Rápidas</h2>
                        </div>
                        <div className="quick-btn-grid">
                            {puedeGestionar && (
                                <button className="cmd-btn primary" onClick={() => navigate('/pedidos')}>
                                    <Plus size={24} />
                                    Nuevo Pedido
                                </button>
                            )}
                            {hasPermission('VER_PRODUCTOS') && (
                                <button className="cmd-btn" onClick={() => navigate('/productos')}>
                                    <Package size={24} />
                                    Productos
                                </button>
                            )}
                            {hasPermission('VER_CLIENTES') && (
                                <button className="cmd-btn" onClick={() => navigate('/clientes')}>
                                    <Users size={24} />
                                    Clientes
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ALERTAS DE STOCK */}
                    {hasPermission('VER_PRODUCTOS') && (
                        <div
                            className="alerts-box"
                            onClick={() => navigate('/productos')}
                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                            title="Ir a inventario"
                        >
                            <div className="section-header">
                                <h2><AlertTriangle size={20} /> Alertas de Stock</h2>
                            </div>
                            {data.stockBajo.length > 0 ? (
                                <div className="stock-list">
                                    {data.stockBajo.slice(0, 5).map(prod => (
                                        <div key={prod.idProducto} className="stock-item">
                                            <span style={{ fontWeight: 600 }}>{prod.nombre}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>
                                                {prod.stockActual} / {prod.stockMinimo}
                                            </span>
                                        </div>
                                    ))}
                                    {data.stockBajo.length > 5 && (
                                        <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                                            + {data.stockBajo.length - 5} más...
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                                    Inventario saludable
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DETALLE PEDIDO (Reutilizado) */}
            {
                selectedOrder && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }} onClick={() => setSelectedOrder(null)}>
                        <div style={{
                            backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
                            width: '90%', maxWidth: '500px', position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }} onClick={e => e.stopPropagation()}>

                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{
                                    position: 'absolute', top: '1rem', right: '1rem',
                                    background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b'
                                }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>
                                    Pedido #{selectedOrder.idPedido}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                    <span className={`status-indicator status-${selectedOrder.estado.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <Truck size={16} />
                                        {formatEstado(selectedOrder.estado)}
                                    </span>
                                    {selectedOrder.usuarioResponsable && (
                                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                                            {selectedOrder.estado === 'PENDIENTE' ? 'Registrado por: ' :
                                                selectedOrder.estado === 'EN_PROCESO' ? 'Procesado por: ' :
                                                    selectedOrder.estado === 'LISTO' ? 'Preparado por: ' :
                                                        selectedOrder.estado === 'ENTREGADO' ? 'Entregado por: ' :
                                                            'Responsable: '}
                                            <strong>{selectedOrder.usuarioResponsable.nombreCompleto}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Cliente</h3>
                                    <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{selectedOrder.cliente?.nombre ?? 'Cliente no asignado'}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Fecha Programada</h3>
                                        <p>{formatoFecha(selectedOrder.fechaProgramada)}</p>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Total</h3>
                                        <p style={{ fontWeight: 'bold', color: '#4f46e5' }}>{formatoMoneda(selectedOrder.total)}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Productos</h3>
                                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                                        {detalles[selectedOrder.idPedido!] ? (
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {detalles[selectedOrder.idPedido!].map((d, i) => (
                                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                        <span>{d.producto.nombre}</span>
                                                        <span style={{ fontWeight: '600' }}>x{d.cantidad}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Cargando productos...</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                                {/* Cobrar lo hace quien atiende al cliente; el resto solo ve el estado. */}
                                {selectedOrder.pagado ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1.5rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '50px', fontWeight: '500' }}>
                                        <span style={{ fontWeight: 'bold' }}>₡</span> Pagado
                                    </div>
                                ) : puedeGestionar && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await pedidoService.marcarPagado(selectedOrder.idPedido!);
                                                const updatedOrder = { ...selectedOrder, pagado: true };
                                                setSelectedOrder(updatedOrder);
                                                // Actualizar data localmente
                                                const updateList = (list: Pedido[]) => list.map(p => p.idPedido === updatedOrder.idPedido ? updatedOrder : p);
                                                setData(prev => ({
                                                    ...prev,
                                                    pedidosHoy: updateList(prev.pedidosHoy),
                                                    atrasados: updateList(prev.atrasados),
                                                    pendientes: updateList(prev.pendientes),
                                                    entregados: updateList(prev.entregados)
                                                }));
                                                showToast('Pedido marcado como pagado exitosamente', 'success');
                                            } catch (error) {
                                                console.error('Error:', error);
                                                showToast('Error al marcar como pagado', 'error');
                                            }
                                        }}
                                        className="action-btn"
                                        style={{ width: 'auto', padding: '0.5rem 1.5rem', backgroundColor: '#10B981', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '50px' }}
                                    >
                                        <span style={{ fontWeight: 'bold' }}>₡</span> Marcar Pagado
                                    </button>
                                )}

                                {/* Avance de estado. Sigue el mismo flujo que la pantalla de Pedidos:
                                    PENDIENTE -> EN_PROCESO -> LISTO -> ENTREGADO. */}
                                {puedeAvanzar && SIGUIENTE_ESTADO[selectedOrder.estado] && (
                                    <button
                                        onClick={() => void avanzarEstado(selectedOrder, SIGUIENTE_ESTADO[selectedOrder.estado])}
                                        className="action-btn"
                                        style={{
                                            width: 'auto', padding: '0.5rem 1.5rem', color: 'white', borderRadius: '50px',
                                            backgroundColor: COLOR_ESTADO[SIGUIENTE_ESTADO[selectedOrder.estado].estado]
                                        }}
                                        title={selectedOrder.estado === 'PENDIENTE'
                                            ? 'Cocina toma el pedido y descuenta el stock'
                                            : undefined}
                                    >
                                        {SIGUIENTE_ESTADO[selectedOrder.estado].etiqueta}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div >
    );
};

export default Dashboard;
