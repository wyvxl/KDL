import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactElement; // El componente hijo que se renderizará si hay acceso
}

/**
 * Componente de ruta protegida.
 * Verifica si el usuario está autenticado antes de renderizar el contenido.
 * Si no está autenticado, redirige al Login.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Verificamos si existe un token o sesión válida en el servicio de autenticación
  if (!authService.isAuthenticated()) {
    // Si no hay sesión, redirigimos a /login reemplazando la historia actual
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizamos el componente solicitado
  return children;
};

export default ProtectedRoute;
