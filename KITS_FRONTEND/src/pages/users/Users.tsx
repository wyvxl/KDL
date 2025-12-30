import React, { useState, useEffect } from 'react';
import './Users.css';
import { usuarioService } from '../../services/usuarioService';
import type { Usuario } from './';
import { type Rol, rolService } from '../../services/rolService';
import { UserModal, ChangePasswordModal, RolModal } from '../../components/modals';

/**
 * Página de Gestión de Usuarios y Roles.
 * Permite listar usuarios, filtrar, gestionar roles, cambiar contraseñas y activar/desactivar cuentas.
 */
const Users: React.FC = () => {
    // Estados principales de datos
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);

    // Estados de modales
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isRolModalOpen, setIsRolModalOpen] = useState(false);

    // Estados seleccionados
    const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<string>('');

    // Filtros y UI
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<number | ''>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            // Se ejecutan en paralelo para optimizar la carga inicial
            await Promise.all([loadUsuarios(), loadRoles()]);
        };

        loadInitialData().catch(console.error);
    }, []);

    // Reaplicar filtros cuando cambian los criterios
    useEffect(() => {
        filterUsuarios();
    }, [usuarios, searchTerm, roleFilter, statusFilter]);

    // Cargar usuarios desde backend
    const loadUsuarios = async () => {
        try {
            setLoading(true);
            const data = await usuarioService.listar();
            setUsuarios(data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    // Cargar roles desde backend
    const loadRoles = async () => {
        try {
            const data = await rolService.listar();
            setRoles(data);
        } catch (error) {
            console.error('Error al cargar roles:', error);
        }
    };

    /**
     * Aplica los filtros de búsqueda, rol y estado sobre la lista de usuarios.
     */
    const filterUsuarios = () => {
        let filtered = usuarios;

        if (searchTerm) {
            filtered = filtered.filter(usuario =>
                usuario.nombreUsuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                usuario.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                usuario.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (roleFilter !== '') {
            filtered = filtered.filter(usuario => usuario.idRol === roleFilter);
        }

        if (statusFilter) {
            filtered = filtered.filter(usuario => usuario.activo === statusFilter);
        }

        setFilteredUsuarios(filtered);
    };

    // --- Manejo de Usuario ---
    const handleNewUser = () => {
        setSelectedUser(null);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (usuario: Usuario) => {
        setSelectedUser(usuario);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = () => {
        // Se usa 'void' para indicar que la promesa se maneja intencionadamente sin 'await'
        void loadUsuarios();
    };

    // --- Acciones de Activación/Desactivación ---
    const handleDeleteUser = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea desactivar este usuario?')) {
            try {
                await usuarioService.eliminar(id);
                await loadUsuarios(); // Esperar a que la lista se recargue
            } catch (error) {
                console.error('Error al desactivar usuario:', error);
            }
        }
    };

    const handleActivateUser = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea activar este usuario?')) {
            try {
                await usuarioService.activar(id);
                await loadUsuarios(); // Esperar a que la lista se recargue
            } catch (error) {
                console.error('Error al activar usuario:', error);
            }
        }
    };

    // --- Cambio de contraseña ---
    const handleChangePassword = (usuario: Usuario) => {
        setSelectedUserForPassword(usuario.nombreUsuario ?? '');
        setIsPasswordModalOpen(true);
    };

    const handlePasswordChangeSuccess = () => {
        // Podríamos mostrar un toast de éxito aquí
        console.log('Contraseña cambiada exitosamente');
    };

    // --- Gestión de Roles ---
    const handleNewRol = () => {
        setIsRolModalOpen(true);
    };

    const handleRolCreated = (nuevoRol: Rol) => {
        setRoles(prevRoles => [...prevRoles, nuevoRol]);
    };

    // --- Auxiliares UI ---
    const getStatusBadge = (activo: string) => {
        return activo === 'S' ?
            <span className="status-badge active">Activo</span> :
            <span className="status-badge inactive">Inactivo</span>;
    };

    const clearFilters = () => {
        setSearchTerm('');
        setRoleFilter('');
        setStatusFilter('');
    };

    const getRoleName = (idRol?: number) => {
        const role = roles.find(r => r.idRol === idRol);
        return role ? role.nombreRol : 'Desconocido';
    };

    return (
        <div className="users-page">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>Usuarios y Roles</h1>
                    {/* Botón toggle filtros */}
                    <button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className="btn btn-secondary btn-toggle-filters"
                        title="Buscar/Filtrar usuarios"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                </div>
                <div className="header-buttons">
                    <button
                        className="btn btn-primary btn-disabled"
                        onClick={handleNewRol}
                        disabled={true}
                    >
                        + Nuevo Rol
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleNewUser}
                    >
                        + Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* SECCIÓN DE FILTROS */}
            {mostrarFiltros && (
                <div className="filters-section">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Buscar por usuario, nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input text-base"
                        />
                    </div>
                    <div className="filters">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="filter-select text-sm"
                        >
                            <option value="">Todos los roles</option>
                            {roles.map(rol => (
                                <option key={rol.idRol} value={rol.idRol}>
                                    {rol.nombreRol}
                                </option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select text-sm"
                        >
                            <option value="">Todos los estados</option>
                            <option value="S">Activos</option>
                            <option value="N">Inactivos</option>
                        </select>
                        <button onClick={clearFilters} className="btn-clear-filters text-sm">
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            )}

            {/* TABLA DE RESULTADOS */}
            <div className="users-grid">
                {loading ? (
                    <p className="empty-state">Cargando usuarios...</p>
                ) : filteredUsuarios.length === 0 ? (
                    <p className="empty-state">
                        {usuarios.length === 0 ? 'No hay usuarios registrados.' : 'No se encontraron usuarios con los filtros aplicados.'}
                    </p>
                ) : (
                    <>
                        <div className="results-info text-sm">
                            Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
                        </div>
                        <table className="users-table text-sm">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Usuario</th>
                                    <th>Nombre Completo</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsuarios.map((usuario) => (
                                    <tr key={usuario.idUsuario}>
                                        <td>{usuario.idUsuario}</td>
                                        <td>{usuario.nombreUsuario}</td>
                                        <td>{usuario.nombreCompleto}</td>
                                        <td>{usuario.email}</td>
                                        <td>{getRoleName(usuario.idRol)}</td>
                                        <td>{getStatusBadge(usuario.activo || 'N')}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-secondary text-sm"
                                                    onClick={() => handleEditUser(usuario)}
                                                    title="Editar usuario"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="btn btn-secondary text-sm"
                                                    onClick={() => handleChangePassword(usuario)}
                                                    title="Cambiar contraseña"
                                                >
                                                    Contraseña
                                                </button>
                                                {usuario.activo === 'S' ? (
                                                    <button
                                                        className="btn btn-secondary text-sm btn-deactivate"
                                                        onClick={() => handleDeleteUser(usuario.idUsuario!)}
                                                        title="Desactivar usuario"
                                                    >
                                                        Desactivar
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-secondary text-sm btn-activate"
                                                        onClick={() => handleActivateUser(usuario.idUsuario!)}
                                                        title="Activar usuario"
                                                    >
                                                        Activar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {/* MODALES */}
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                usuario={selectedUser}
            />

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSuccess={handlePasswordChangeSuccess}
                nombreUsuario={selectedUserForPassword}
            />

            <RolModal
                isOpen={isRolModalOpen}
                onClose={() => setIsRolModalOpen(false)}
                onSuccess={handleRolCreated}
            />
        </div>
    );
};

export default Users;
