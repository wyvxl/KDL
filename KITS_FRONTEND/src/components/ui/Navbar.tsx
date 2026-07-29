import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, UserCog, LogOut, ChefHat, KeyRound } from 'lucide-react';
import './Navbar.css';

import { authService } from '../../services/authService';
import { tienePermiso } from '../../utils/permisos';
import ChangePasswordModal from '../modals/ChangePasswordModal';

/**
 * Componente Navbar principal de la aplicación.
 * Muestra el logo, los enlaces de navegación según permisos y el menú de usuario.
 */
const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    // Cambiar la contraseña propia no depende del rol: se ofrece desde aquí para que
    // llegue a todos, no solo a quien puede entrar a la pantalla de Usuarios.
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Función auxiliar para clases CSS de enlaces activos
    const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `nav-link ${isActive ? 'active' : ''}`;

    // Manejo de cierre de sesión
    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Verificación de permisos para mostrar/ocultar enlaces
    const hasPermission = tienePermiso;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo y Marca */}
                <div className="navbar-brand">
                    <NavLink to="/" className="brand-link">
                        <ChefHat className="brand-icon" size={28} strokeWidth={2} />
                        <span className="brand-text">KITS</span>
                    </NavLink>
                </div>

                {/* Menú de Navegación Central */}
                <div className="navbar-menu">
                    {hasPermission('VER_DASHBOARD') && (
                        <NavLink to="/" className={getNavLinkClass}>
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </NavLink>
                    )}
                    {hasPermission('VER_PRODUCTOS') && (
                        <NavLink to="/productos" className={getNavLinkClass}>
                            <Package size={18} />
                            <span>Productos</span>
                        </NavLink>
                    )}
                    {hasPermission('VER_CLIENTES') && (
                        <NavLink to="/clientes" className={getNavLinkClass}>
                            <Users size={18} />
                            <span>Clientes</span>
                        </NavLink>
                    )}
                    {hasPermission('VER_PEDIDOS') && (
                        <NavLink to="/pedidos" className={getNavLinkClass}>
                            <ShoppingCart size={18} />
                            <span>Pedidos</span>
                        </NavLink>
                    )}
                    {hasPermission('VER_USUARIOS') && (
                        <NavLink to="/usuarios" className={getNavLinkClass}>
                            <UserCog size={18} />
                            <span>Usuarios</span>
                        </NavLink>
                    )}
                </div>

                {/* Panel de Usuario y Logout */}
                <div className="navbar-user">
                    <span className="user-name">
                        {user?.nombreCompleto || 'Usuario'}
                    </span>
                    <button
                        className="btn-icon"
                        onClick={() => setIsPasswordModalOpen(true)}
                        title="Cambiar mi contraseña"
                        aria-label="Cambiar mi contraseña"
                    >
                        <KeyRound size={18} />
                    </button>
                    <button className="btn-logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Salir</span>
                    </button>
                </div>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSuccess={() => setIsPasswordModalOpen(false)}
                modo="propia"
            />
        </nav>
    );
};

export default Navbar;
