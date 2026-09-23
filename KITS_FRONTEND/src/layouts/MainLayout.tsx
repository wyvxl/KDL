import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/ui';

/**
 * Layout principal de la aplicación.
 * Define la estructura base con Navbar superior y área de contenido.
 * Se utiliza en todas las rutas privadas (después del login).
 */
const MainLayout = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            {/* Barra de navegación superior */}
            <Navbar />

            {/* Área principal donde se renderizan las páginas hijas (Outlet) */}
            <main className="main-area">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
