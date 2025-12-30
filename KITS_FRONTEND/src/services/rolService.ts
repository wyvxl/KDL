import api from './api';
import { handleApiError } from '../utils/errorHandler';

/** Interfaz para Roles de usuario */
export interface Rol {
  idRol?: number; // Opcional al crear
  nombreRol: string;
  descripcion: string;
}

/**
 * Servicio para gestión de Roles y Permisos.
 * Permite listar y definir nuevos roles en el sistema.
 */
const rolService = {
  /**
   * Obtiene todos los roles disponibles.
   * @returns Promesa con lista de roles
   */
  listar: async (): Promise<Rol[]> => {
    try {
      const response = await api.get<Rol[]>('/rol');
      return response as unknown as Rol[];
    } catch (error) {
      // Usar errorHandler con datos de respaldo vacíos
      const fallbackResult = handleApiError(error, []);
      // Verificar que el resultado sea un array válido
      return Array.isArray(fallbackResult) ? fallbackResult as Rol[] : [];
    }
  },

  /**
   * Crea un nuevo rol.
   * @param rol Datos del nuevo rol
   * @returns Promesa con el rol creado
   */
  crear: async (rol: Rol): Promise<Rol> => {
    try {
      const response = await api.post<Rol>('/rol', rol);
      return response as unknown as Rol;
    } catch (error) {
      // Para crear no hay fallback, relanzamos el error
      handleApiError(error);
      throw error; // Esta línea nunca se ejecutará si handleApiError no lanza
    }
  },
};

export { rolService };
