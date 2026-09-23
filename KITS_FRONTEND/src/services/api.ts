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

/** Forma mínima de un error de red/axios de la que extraemos información de forma segura. */
interface ApiErrorLike {
  response?: { status?: number; statusText?: string; data?: { error?: string } };
  code?: string;
  message?: string;
  config?: { url?: string };
}

// Función para extraer información del error de forma segura
const extractErrorInfo = (error: ApiErrorLike): string => {
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
const sanitizeErrorForLog = (error: ApiErrorLike | null | undefined): string => {
  if (!error) return ERROR_MESSAGES.UNKNOWN;

  const errorInfo = extractErrorInfo(error);

  // Sanitizar caracteres peligrosos
  return errorInfo
    .replace(/[\r\n]/g, ' ') // Reemplazar saltos de línea
    // eslint-disable-next-line no-control-regex -- se remueven intencionalmente caracteres de control del log
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
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080', // URL del backend (sobreescribible con VITE_API_URL)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de peticiones: adjunta el token JWT (si existe) en el encabezado Authorization.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Interceptor de respuestas global.
 * Permite manejar respuestas exitosas y errores de forma centralizada antes de que lleguen a los componentes.
 */
api.interceptors.response.use(
  (response) => response.data, // Si la petición es exitosa, retornamos directamente los datos
  (error: ApiErrorLike) => {
    // Log de error sanitizado para depuración
    console.error('Error en API:', sanitizeErrorForLog(error));

    // 401 en un endpoint protegido = sesión inexistente o expirada.
    // (Se excluye el login, cuyo 401 significa credenciales inválidas y lo maneja el authService.)
    const url = error.config?.url ?? '';
    if (error.response?.status === 401 && !url.includes('/usuario/autenticar')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // BASE_URL respeta la ruta de publicación (p. ej. /KDL/ en GitHub Pages).
      const login = `${import.meta.env.BASE_URL}login`;
      if (window.location.pathname !== login) {
        window.location.href = login;
      }
    }

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
