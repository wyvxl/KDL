import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, UserCog, LogOut, ChefHat } from 'lucide-react';
import './Navbar.css';

import { authService } from '../../services/authService';

/**
 * Componente Navbar principal de la aplicación.
 * Muestra el logo, los enlaces de navegación según permisos y el menú de usuario.
 */
const Navbar: React.FC = () => {
    const navigate = useNavigate();
    // Obtenemos usuario y permisos actuales
    const user = authService.getCurrentUser();
    const permisos = user?.permisos || [];

    // Función auxiliar para clases CSS de enlaces activos
    const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `nav-link ${isActive ? 'active' : ''}`;

    // Manejo de cierre de sesión
    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Verificación de permisos para mostrar/ocultar enlaces
    const hasPermission = (p: string) => permisos.includes(p) || permisos.includes("GESTIONAR_TODO");

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
                    <button className="btn-logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
