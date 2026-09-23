
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth';
import Dashboard from './pages/dashboard';
import Products from './pages/products';
import Clients from './pages/clients';
import Orders from './pages/orders';
import Users from './pages/users';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PERMISOS } from './utils/permisos';
import './App.css';

/**
 * Componente Raíz de la Aplicación.
 * Configura el enrutamiento principal (React Router).
 * Define rutas públicas (Login) y privadas (protegidas por autenticación).
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública: Login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas Privadas: Requieren autenticación */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard principal */}
          <Route index element={<Dashboard />} />

          {/* Módulos de gestión */}
          <Route path="productos" element={<ProtectedRoute permiso={PERMISOS.VER_PRODUCTOS}><Products /></ProtectedRoute>} />
          <Route path="clientes" element={<ProtectedRoute permiso={PERMISOS.VER_CLIENTES}><Clients /></ProtectedRoute>} />
          <Route path="pedidos" element={<ProtectedRoute permiso={PERMISOS.VER_PEDIDOS}><Orders /></ProtectedRoute>} />
          <Route path="usuarios" element={<ProtectedRoute permiso={PERMISOS.VER_USUARIOS}><Users /></ProtectedRoute>} />
        </Route>

        {/* Redirección por defecto: Cualquier ruta desconocida va al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
