import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Función para mostrar error crítico al usuario
const showCriticalError = (message: string) => {
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: Arial, sans-serif;
      background-color: #f8f9fa;
      color: #333;
      text-align: center;
      padding: 2rem;
    ">
      <h1 style="color: #dc3545; margin-bottom: 1rem;">Error de Aplicación</h1>
      <p style="margin-bottom: 1rem; max-width: 600px;">${message}</p>
      <p style="color: #6c757d; font-size: 0.9rem;">
        Por favor, recargue la página o contacte al soporte técnico.
      </p>
      <button 
        onclick="window.location.reload()" 
        style="
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        "
      >
        Recargar Página
      </button>
    </div>
  `;
};

// Obtener elemento raíz del DOM con manejo robusto de errores
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Error crítico: No se encontró el elemento #root en el DOM');
  showCriticalError(
    'No se pudo inicializar la aplicación. El elemento contenedor principal no fue encontrado en la página.'
  );
} else if (!(rootElement instanceof HTMLElement)) {
  console.error('Error crítico: El elemento #root no es un elemento HTML válido');
  showCriticalError(
    'Error de configuración: El contenedor de la aplicación no es válido.'
  );
} else {
  // Renderizar aplicación solo si el elemento es válido
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    console.error('Error al renderizar la aplicación:', error);
    showCriticalError(
      'Error inesperado al inicializar la aplicación. Verifique la consola para más detalles.'
    );
  }
}


