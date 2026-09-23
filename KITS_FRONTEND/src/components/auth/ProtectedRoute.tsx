import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { tienePermiso } from '../../utils/permisos';

interface ProtectedRouteProps {
  children: React.ReactElement; // El componente hijo que se renderizará si hay acceso
  /**
   * Permiso necesario para ver la pantalla (ver utils/permisos.ts). Sin él, quien escriba
   * la URL a mano vuelve al inicio en vez de ver una pantalla que el backend responde con 403.
   */
  permiso?: string;
}

/**
 * Componente de ruta protegida.
 * Verifica si el usuario está autenticado (y, si se indica, si tiene el permiso) antes de
 * renderizar el contenido. Si no hay sesión, redirige al Login.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permiso }) => {
  // Verificamos si existe un token o sesión válida en el servicio de autenticación
  if (!authService.isAuthenticated()) {
    // Si no hay sesión, redirigimos a /login reemplazando la historia actual
    return <Navigate to="/login" replace />;
  }

  if (permiso && !tienePermiso(permiso)) {
    return <Navigate to="/" replace />;
  }

  // Si está autenticado, renderizamos el componente solicitado
  return children;
};

export default ProtectedRoute;
