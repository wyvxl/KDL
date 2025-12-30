import React, { useState, useEffect } from 'react';
import { clienteService, type Cliente } from '../../services/clienteService';
import { ClientModal } from '../../components/modals';
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
    const [mostrarBusqueda, setMostrarBusqueda] = useState<boolean>(false);

    // Cargar clientes al montar el componente
    useEffect(() => {
        loadClientes();
    }, []);

    /**
     * Obtiene la lista completa de clientes desde el backend.
     */
    const loadClientes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await clienteService.listar();
            if (Array.isArray(data)) {
                setClientes(data);
            } else {
                throw new Error('Datos inválidos recibidos del servidor');
            }
        } catch (err: any) {
            console.error('Error loading clientes:', err);
            setClientes([]);
            // Manejo diferenciado de errores (servidor vs conexión)
            const errorMsg = err?.response?.status === 500
                ? 'Error del servidor - No se pueden cargar los datos'
                : 'Backend no disponible - Verifique la conexión';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

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

    /**
     * Filtra la lista de clientes según el término de búsqueda.
     * Busca coincidencias parciales en el nombre (case-insensitive).
     */
    const getClientesFiltrados = () => {
        if (!busqueda.trim()) return clientes;

        return clientes.filter(cliente =>
            cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
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
                    backgroundColor: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)'
                }}>
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
        </div>
    );
};

export default Clients;
