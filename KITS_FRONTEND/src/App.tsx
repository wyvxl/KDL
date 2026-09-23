import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PERMISOS } from './utils/permisos';
import './App.css';

// Cada pantalla se descarga al entrar a ella: el login ya no carga el código de
// pedidos, usuarios, etc. (antes todo iba en un único archivo JS).
const Login = lazy(() => import('./pages/auth'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Products = lazy(() => import('./pages/products'));
const Clients = lazy(() => import('./pages/clients'));
const Orders = lazy(() => import('./pages/orders'));
const Users = lazy(() => import('./pages/users'));

/**
 * Componente Raíz de la Aplicación.
 * Configura el enrutamiento principal (React Router).
 * Define rutas públicas (Login) y privadas (protegidas por autenticación).
 */
function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="loading-app">Cargando...</div>}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
