import React, { useState, useEffect } from 'react';
import { clienteService, type Cliente } from '../../services/clienteService';
import { ClientModal, ConfirmModal } from '../../components/modals';
import './Clients.css';

/**
 * Página de Gestión de Clientes.
 * Permite visualizar, buscar, crear y editar clientes.
 */
const Clients: React.FC = () => {
    // Estados principales
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para control de modal y selección
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Cliente | null>(null);

    // Estados de búsqueda
    const [busqueda, setBusqueda] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('S'); // Por defecto solo activos
    const [mostrarBusqueda, setMostrarBusqueda] = useState<boolean>(false);

    // Modal de confirmación de baja
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [deletingClientId, setDeletingClientId] = useState<number | null>(null);

    /**
     * Obtiene la lista de clientes desde el backend.
     *
     * Se piden también los inactivos: esta es la pantalla de mantenimiento y sin ellos
     * un cliente dado de baja desaparecería sin forma de reactivarlo. El filtro de
     * estado decide cuáles se muestran.
     */
    const loadClientes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await clienteService.listar(true);
            if (Array.isArray(data)) {
                setClientes(data);
            } else {
                throw new Error('Datos inválidos recibidos del servidor');
            }
        } catch (err) {
            console.error('Error loading clientes:', err);
            setClientes([]);
            // Manejo diferenciado de errores (servidor vs conexión)
            const status = (err as { response?: { status?: number } })?.response?.status;
            const errorMsg = status === 500
                ? 'Error del servidor - No se pueden cargar los datos'
                : 'Backend no disponible - Verifique la conexión';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Cargar clientes al montar el componente
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar (loadClientes gestiona el estado de carga)
        void loadClientes();
    }, []);

    // Abre el modal para crear un nuevo cliente
    const handleNewClient = () => {
        setEditingClient(null);
        setShowModal(true);
    };

    // Abre el modal para editar un cliente existente
    const handleEditClient = (cliente: Cliente) => {
        setEditingClient(cliente);
        setShowModal(true);
    };

    // Cierra el modal y limpia selección
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingClient(null);
    };

    // Recarga la lista tras agregar/editar un cliente
    const handleClientAdded = () => {
        loadClientes();
    };

    // Abre la confirmación para dar de baja un cliente
    const handleDeleteClient = (idCliente: number) => {
        setDeletingClientId(idCliente);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingClientId) return;
        try {
            await clienteService.desactivar(deletingClientId);
            await loadClientes();
        } catch (err) {
            console.error('Error al dar de baja el cliente:', err);
            setError('No se pudo dar de baja el cliente.');
        } finally {
            setShowConfirmModal(false);
            setDeletingClientId(null);
        }
    };

    // Reactiva un cliente dado de baja
    const handleActivateClient = async (idCliente: number) => {
        try {
            await clienteService.activar(idCliente);
            await loadClientes();
        } catch (err) {
            console.error('Error al reactivar el cliente:', err);
            setError('No se pudo reactivar el cliente.');
        }
    };

    /**
     * Filtra la lista de clientes por nombre y estado.
     */
    const getClientesFiltrados = () => {
        let filtrados = clientes;

        if (statusFilter) {
            filtrados = filtrados.filter(cliente => (cliente.activo ?? 'S') === statusFilter);
        }

        if (busqueda.trim()) {
            filtrados = filtrados.filter(cliente =>
                cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
        }

        return filtrados;
    };

    if (loading) return <div>Cargando clientes...</div>;

    const clientesFiltrados = getClientesFiltrados();
    const hasClientes = clientesFiltrados.length > 0;

    return (
        <div className="clients-page">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>Clientes</h1>
                    {/* Botón toggle búsqueda */}
                    <button
                        onClick={() => setMostrarBusqueda(!mostrarBusqueda)}
                        className="btn btn-secondary"
                        style={{
                            padding: '0.5rem',
                            minWidth: 'auto',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Buscar cliente"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                </div>
                {/* Botón Nuevo Cliente */}
                <button
                    className="btn btn-primary"
                    onClick={handleNewClient}
                >
                    + Nuevo Cliente
                </button>
            </div>

            {/* Barra de búsqueda condicional */}
            {mostrarBusqueda && (
                <div style={{
                    marginBottom: '1.5rem', padding: '1rem',
                    backgroundColor: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)',
                    display: 'flex', gap: '1rem'
                }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Buscar por nombre
                        </label>
                        <input
                            type="text"
                            placeholder="Escribe el nombre del cliente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)', backgroundColor: 'white', fontSize: '1rem'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Filtrar por Estado
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)', backgroundColor: 'white', fontSize: '1rem'
                            }}
                        >
                            <option value="S">Activos</option>
                            <option value="N">Dados de baja</option>
                            <option value="">Todos</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Mensajes de error */}
            {error && (
                <div style={{
                    backgroundColor: '#fef3c7', color: '#92400e', padding: '0.75rem',
                    borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fcd34d'
                }}>
                    {error}
                </div>
            )}

            {/* Grid de tarjetas de clientes */}
            <div className="clients-grid">
                {error ? (
                    <p className="empty-state">No se pueden cargar los clientes. {error}</p>
                ) : !hasClientes ? (
                    <p className="empty-state">
                        {busqueda ? 'No se encontraron clientes con ese nombre.' : 'No hay clientes registrados.'}
                    </p>
                ) : (
                    clientesFiltrados.map((cliente) => (
                        <div key={cliente.idCliente} className="client-card">
                            <div className="client-header">
                                <h3>{cliente.nombre}</h3>
                                {cliente.activo === 'N' && (
                                    <span style={{
                                        backgroundColor: '#ef4444', color: 'white',
                                        padding: '0.25rem 0.5rem', borderRadius: '4px',
                                        fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem'
                                    }}>
                                        DADO DE BAJA
                                    </span>
                                )}
                            </div>
                            <div className="client-info">
                                <div className="info-row">
                                    <span><strong>Teléfono:</strong> {cliente.telefono}</span>
                                </div>
                                <div className="info-row">
                                    <span><strong>Email:</strong> {cliente.email}</span>
                                </div>
                                <div className="info-row">
                                    <span><strong>Dirección:</strong> {cliente.direccion}</span>
                                </div>
                                {cliente.notas && (
                                    <div className="info-row">
                                        <span><strong>Notas:</strong> {cliente.notas}</span>
                                    </div>
                                )}
                            </div>
                            <div className="client-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handleEditClient(cliente)}
                                >
                                    Editar
                                </button>
                                {cliente.activo === 'N' ? (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleActivateClient(cliente.idCliente!)}
                                        title="Volver a ofrecer este cliente al tomar pedidos"
                                    >
                                        Reactivar
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleDeleteClient(cliente.idCliente!)}
                                        title="Dar de baja: conserva su historial de pedidos"
                                    >
                                        Dar de Baja
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Cliente */}
            <ClientModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onClientAdded={handleClientAdded}
                client={editingClient}
            />

            {/* Confirmación de baja */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmDelete}
                title="Confirmar Baja"
            >
                ¿Dar de baja a este cliente? Conserva su historial de pedidos y podés
                reactivarlo cuando quieras; simplemente deja de aparecer al tomar pedidos nuevos.
            </ConfirmModal>
        </div>
    );
};

export default Clients;
