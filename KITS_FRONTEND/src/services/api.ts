import axios from 'axios';

// Constantes para formateo de errores
const ERROR_MESSAGES = {
  UNKNOWN: 'Error desconocido',
  NO_DETAILS: 'Error sin detalles'
} as const;

const ERROR_LIMITS = {
  STATUS_TEXT: 100,
  ERROR_CODE: 50,
  MESSAGE: 200
} as const;

// Función para extraer información del error de forma segura
const extractErrorInfo = (error: any): string => {
  if (error.response?.status) {
    const statusInfo = `HTTP ${error.response.status}`;
    const statusText = error.response.statusText ? 
      ` - ${String(error.response.statusText).substring(0, ERROR_LIMITS.STATUS_TEXT)}` : '';
    return statusInfo + statusText;
  }
  
  if (error.code) {
    return `Código: ${String(error.code).substring(0, ERROR_LIMITS.ERROR_CODE)}`;
  }
  
  if (error.message) {
    return String(error.message).substring(0, ERROR_LIMITS.MESSAGE);
  }
  
  return ERROR_MESSAGES.NO_DETAILS;
};

// Función para sanitizar datos de error antes del logging
const sanitizeErrorForLog = (error: any): string => {
  if (!error) return ERROR_MESSAGES.UNKNOWN;
  
  const errorInfo = extractErrorInfo(error);
  
  // Sanitizar caracteres peligrosos
  return errorInfo
    .replace(/[\r\n]/g, ' ') // Reemplazar saltos de línea
    .replace(/[\x00-\x1F\x7F]/g, '') // Remover caracteres de control
    .trim();
};

/**
 * Instancia configurada de Axios para comunicación con el backend (API REST).
 * Se define la URL base y los encabezados comunes (Content-Type).
 * 
 * Esta configuración centraliza la conexión con el servidor Spring Boot.
 */
const api = axios.create({
  baseURL: 'http://localhost:8080', // URL del backend (ajustar si se despliega en otro puerto/host)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de respuestas global.
 * Permite manejar respuestas exitosas y errores de forma centralizada antes de que lleguen a los componentes.
 */
api.interceptors.response.use(
  (response) => response.data, // Si la petición es exitosa, retornamos directamente los datos
  (error) => {
    // Log de error sanitizado para depuración
    console.error('Error en API:', sanitizeErrorForLog(error));

    // Preservar solo mensajes de stock específicos del backend
    if (error.response?.data?.error && error.response.data.error.includes('Stock insuficiente')) {
      // Extraer solo la parte del mensaje de stock, sin el stack trace de Oracle
      const match = error.response.data.error.match(/Stock insuficiente para el producto: [^\n\r]+/);
      error.message = match ? match[0] : 'Stock insuficiente';
    } else if (error.response?.status === 500) {
      error.message = 'Error interno del servidor';
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      error.message = 'No se puede conectar al servidor. Verifique su conexión.';
    }

    return Promise.reject(error); // Rechazamos la promesa para que el componente maneje el error si es necesario
  }
);

export default api;
