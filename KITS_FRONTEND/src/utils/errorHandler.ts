/**
 * Utilidad para manejar errores de API de forma centralizada.
 * Permite definir datos de respaldo (fallback) para que la UI no rompa si el backend falla.
 * 
 * @param error El objeto de error capturado (usualmente de Axios o fetch)
 * @param fallbackData Datos opcionales a retornar si se detecta un fallo de conexión
 * @returns Los datos de respaldo si aplica, o relanza el error para manejo superior
 */
// Constantes para códigos de error
const ERROR_CODES = {
  CONNECTION_REFUSED: 'ECONNREFUSED',
  NETWORK_ERROR: 'Network Error'
} as const;

// Función para detectar errores de conexión
const isConnectionError = (errorCode?: string, errorMessage?: string): boolean => {
  const hasConnectionRefused = errorCode === ERROR_CODES.CONNECTION_REFUSED;
  const hasNetworkError = typeof errorMessage === 'string' && 
    errorMessage.includes(ERROR_CODES.NETWORK_ERROR);
  
  return hasConnectionRefused || hasNetworkError;
};

// Función para sanitizar datos antes del logging
const sanitizeForLog = (data: unknown): string => {
  if (data === null || data === undefined) {
    return String(data);
  }
  
  let logString: string;
  if (typeof data === 'object') {
    try {
      logString = JSON.stringify(data);
    } catch {
      logString = '[Object - no serializable]';
    }
  } else {
    logString = String(data);
  }
  
  // Remover caracteres peligrosos para logs
  return logString
    .replace(/[\r\n]/g, ' ') // Reemplazar saltos de línea
    // eslint-disable-next-line no-control-regex -- se remueven intencionalmente caracteres de control del log
    .replace(/[\x00-\x1F\x7F]/g, '') // Remover caracteres de control
    .substring(0, 500); // Limitar longitud
};

export const handleApiError = (error: unknown, fallbackData?: unknown) => {
  // Logueamos el error de forma segura
  console.error('Error capturado en API helper:', sanitizeForLog(error));

  // Verificamos si el error es un objeto válido antes de acceder a sus propiedades
  const isErrorObject = error && typeof error === 'object' && error !== null;
  const errorCode = isErrorObject && 'code' in error ? (error as { code?: string }).code : undefined;
  const errorMessage = isErrorObject && 'message' in error ? (error as { message?: string }).message : undefined;

  // Si es un error de conexión (backend caído o inalcanzable), usamos fallback si existe
  if (isConnectionError(errorCode, errorMessage)) {
    console.warn('Backend no disponible. Retornando datos de respaldo (mock/vacío).');
    return fallbackData || [];
  }

  // Si no es error de conexión, relanzamos para que el componente decida qué hacer
  throw error;
};

/**
 * Función de salud para verificar conectividad con el Backend.
 * Hace un ping al endpoint /health para saber si el servidor está arriba.
 * 
 * Útil para mostrar estados de "Sistema Offline" en la UI.
 * 
 * @returns Promesa que resuelve true si hay conexión, false si no.
 */
export const isBackendAvailable = async (): Promise<boolean> => {
  // Usamos AbortController para no dejar la petición colgada eternamente
  const controller = new AbortController();
  // Timeout de 5 segundos para la verificación
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('http://localhost:8080/health', {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    // Retorna true solo si el status HTTP es 200-299
    return response.ok;
  } catch {
    // Si falla el fetch por timeout o red, el backend no está disponible
    clearTimeout(timeoutId);
    return false;
  }
};