import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/ui';

/**
 * Layout principal de la aplicación.
 * Define la estructura base con Navbar superior y área de contenido.
 * Se utiliza en todas las rutas privadas (después del login).
 */
const MainLayout = () => {
    return (
        <div className="app-shell">
            {/* Barra de navegación superior */}
            <Navbar />

            {/* Área principal donde se renderizan las páginas hijas (Outlet) */}
            <main className="main-area">
                {/* Suspense propio: al cambiar de pantalla el navbar se queda y solo el
                    contenido muestra "Cargando..." mientras llega su código. */}
                <Suspense fallback={<div className="loading-page">Cargando...</div>}>
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
};

export default MainLayout;
