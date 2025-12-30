import api from './api';
import { handleApiError } from '../utils/errorHandler';

/**
 * Interfaz que define la estructura del Usuario autenticado.
 * Debe coincidir con los datos retornados por el backend tras el login.
 */
export interface User {
  idUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  email: string;
  idRol: number;
  permisos: string[]; // Lista de códigos de permiso (ej: 'VER_PEDIDOS')
}

/**
 * Servicio de Autenticación.
 * Maneja el inicio de sesión, cierre de sesión y la obtención del usuario actual.
 */
export const authService = {
  /**
   * Autentica al usuario con sus credenciales.
   * @param credentials Objeto con nombreUsuario y contrasena
   * @returns Promesa con los datos del usuario autenticado
   */
  login: async (credentials: { nombreUsuario: string, contrasena: string }): Promise<User> => {
    // Validaciones previas
    if (!credentials.nombreUsuario?.trim()) {
      throw new Error('El nombre de usuario es requerido');
    }
    if (!credentials.contrasena?.trim()) {
      throw new Error('La contraseña es requerida');
    }

    try {
      // Realiza petición POST al endpoint de autenticación
      const response = await api.post<User>('/usuario/autenticar', credentials);
      
      // Validar estructura de la respuesta
      const user = response as unknown as User;
      if (!user || typeof user !== 'object') {
        throw new Error('Respuesta inválida del servidor');
      }
      
      // Validar campos requeridos del usuario
      if (!user.idUsuario || !user.nombreUsuario || !user.idRol) {
        throw new Error('Datos de usuario incompletos');
      }
      
      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      // Limpiar cualquier sesión previa en caso de error
      localStorage.removeItem('user');
      
      // Determinar tipo de error y mensaje apropiado
      if (error instanceof Error) {
        // Si es un error que ya lanzamos, mantener el mensaje
        if (error.message.includes('requerido') || error.message.includes('inválida') || error.message.includes('incompletos')) {
          throw error;
        }
      }
      
      // Manejar errores de API con el errorHandler existente
      try {
        handleApiError(error);
      } catch (handledError) {
        // Si handleApiError lanza una excepción, determinar el mensaje apropiado
        const isNetworkError = handledError instanceof Error && 
          (handledError.message.includes('Network') || handledError.message.includes('ECONNREFUSED'));
        
        if (isNetworkError) {
          throw new Error('Sin conexión al servidor. Verifique su conexión.');
        } else {
          throw new Error('Credenciales inválidas o error del servidor.');
        }
      }
      
      // Fallback si handleApiError no lanza excepción
      throw new Error('Error inesperado durante la autenticación.');
    }
  },

  /**
   * Cierra la sesión del usuario eliminando sus datos del almacenamiento local.
   */
  logout: (): void => {
    localStorage.removeItem('user');
  },

  /**
   * Obtiene el usuario actualmente autenticado desde localStorage.
   * @returns Objeto User si existe sesión, o null si no.
   */
  getCurrentUser: (): User | null => {
    const userString = localStorage.getItem('user');
    if (userString && userString !== 'undefined') {
      try {
        return JSON.parse(userString);
      } catch (e) {
        console.error("Error al leer usuario de localStorage", e);
        return null;
      }
    }
    return null;
  },

  /**
   * Verifica si hay una sesión activa.
   * @returns true si el usuario está logueado, false en caso contrario.
   */
  isAuthenticated: (): boolean => {
    return authService.getCurrentUser() !== null;
  }
};
