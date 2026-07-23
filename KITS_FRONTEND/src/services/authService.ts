import api from './api';

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

/** Respuesta del endpoint de autenticación del backend. */
interface AuthResponse {
  token: string;
  usuario: User;
}

/**
 * Traduce un error de login a un mensaje claro para el usuario.
 * Mantiene los mensajes de validación que ya lanzamos nosotros.
 */
const traducirErrorLogin = (error: unknown): Error => {
  if (error instanceof Error &&
    (error.message.includes('requerido') ||
      error.message.includes('inválida') ||
      error.message.includes('incompletos'))) {
    return error;
  }

  const err = error as { response?: { status?: number }; code?: string; message?: string };

  if (err.response?.status === 401) {
    return new Error('Credenciales inválidas.');
  }
  const sinRespuesta = !err.response;
  const esRed = err.code === 'ECONNREFUSED' || (err.message?.includes('Network') ?? false);
  if (sinRespuesta || esRed) {
    return new Error('Sin conexión al servidor. Verifique su conexión.');
  }
  return new Error('Error del servidor. Inténtelo de nuevo.');
};

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
      // El interceptor de respuesta devuelve directamente el cuerpo (data).
      const data = await api.post('/usuario/autenticar', credentials) as unknown as AuthResponse;

      if (!data || typeof data !== 'object' || !data.token || !data.usuario) {
        throw new Error('Respuesta inválida del servidor');
      }

      const user = data.usuario;
      if (!user.idUsuario || !user.nombreUsuario || !user.idRol) {
        throw new Error('Datos de usuario incompletos');
      }

      // Guardar token y usuario para futuras peticiones y persistencia de sesión.
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));

      return user;
    } catch (error) {
      // Limpiar cualquier sesión previa en caso de error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw traducirErrorLogin(error);
    }
  },

  /**
   * Cierra la sesión del usuario eliminando su token y datos del almacenamiento local.
   */
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Obtiene el token JWT actual, o null si no hay sesión.
   */
  getToken: (): string | null => {
    return localStorage.getItem('token');
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
   * Verifica si hay una sesión activa (token presente).
   * @returns true si el usuario está logueado, false en caso contrario.
   */
  isAuthenticated: (): boolean => {
    return authService.getToken() !== null && authService.getCurrentUser() !== null;
  }
};
