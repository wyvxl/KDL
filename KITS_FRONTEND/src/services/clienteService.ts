import api from './api';
import type { Cliente } from '../pages/clients';
import { handleApiError } from '../utils/errorHandler';

// Re-exportamos el tipo Cliente para facilitar su uso en otros componentes
export type { Cliente };

/**
 * Servicio para gestión de Clientes.
 * Permite listar y crear nuevos clientes.
 */
export const clienteService = {
  /**
   * Obtiene la lista completa de clientes registrados.
   * @returns Promesa con array de objetos Cliente
   */
  listar: async (): Promise<Cliente[]> => {
    try {
      const response = await api.get('/cliente');
      return response as unknown as Cliente[];
    } catch (error) {
      try {
        const fallbackResult = handleApiError(error, []);
        return Array.isArray(fallbackResult) ? fallbackResult as Cliente[] : [];
      } catch (handlerError) {
        // Si handleApiError lanza excepción, registrar y retornar array vacío
        console.warn('handleApiError falló en clienteService.listar:', handlerError);
        return [];
      }
    }
  },

  /**
   * Registra un nuevo cliente en el sistema.
   * @param cliente Datos del nuevo cliente
   * @returns Promesa con el ID del cliente creado
   */
  guardar: async (cliente: Cliente): Promise<number> => {
    try {
      const response = await api.post('/cliente', cliente);
      return response as unknown as number;
    } catch (error) {
      // Para guardar no hay fallback, relanzamos el error
      handleApiError(error);
      throw error;
    }
  },
};
