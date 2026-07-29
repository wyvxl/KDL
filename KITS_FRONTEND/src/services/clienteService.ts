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
   * Obtiene la lista de clientes.
   *
   * @param incluirInactivos true para traer también los dados de baja. Se usa en la
   *   pantalla de mantenimiento; al tomar un pedido se deja en false para no ofrecer
   *   clientes inactivos.
   * @returns Promesa con array de objetos Cliente
   */
  listar: async (incluirInactivos = false): Promise<Cliente[]> => {
    try {
      const response = await api.get('/cliente', { params: { incluirInactivos } });
      return response as unknown as Cliente[];
    } catch (error) {
      // Solo se devuelve lista vacía si el backend no responde. Un 403 o un 500 se
      // relanzan: antes se tragaban todos los errores y la pantalla quedaba en blanco
      // sin decir por qué (p. ej. un rol sin acceso a clientes veía "no hay clientes").
      const fallbackResult = handleApiError(error, []);
      return Array.isArray(fallbackResult) ? fallbackResult as Cliente[] : [];
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

  /**
   * Da de baja un cliente (baja lógica).
   *
   * No se borra: conserva su historial de pedidos y puede reactivarse. Solo deja de
   * ofrecerse al tomar pedidos nuevos.
   *
   * @param id ID del cliente
   * @returns Promesa con el número de filas afectadas
   */
  desactivar: async (id: number): Promise<number> => {
    return await api.delete(`/cliente/${id}`) as unknown as number;
  },

  /**
   * Reactiva un cliente dado de baja.
   * @param id ID del cliente
   * @returns Promesa con el número de filas afectadas
   */
  activar: async (id: number): Promise<number> => {
    return await api.put(`/cliente/${id}/activar`) as unknown as number;
  },
};
