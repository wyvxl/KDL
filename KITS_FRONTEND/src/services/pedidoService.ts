import api from './api';
import type { Pedido, DetallePedido, DetallePedidoArray } from '../pages/orders';

// Función para convertir campos de fecha de string a Date
const parsePedidoDates = (pedido: Pedido): Pedido => {
  return {
    ...pedido,
    // Intentar convertir fechaPedido si existe
    fechaPedido: pedido.fechaPedido ? new Date(pedido.fechaPedido) : undefined,
    // Intentar convertir fechaEntrega si existe
    fechaEntrega: pedido.fechaEntrega ? new Date(pedido.fechaEntrega) : undefined,
  };
};


/**
 * Servicio para la gestión integral de Pedidos.
 * Cubre desde la creación, listado, gestión de detalles hasta el cambio de estados.
 */
export const pedidoService = {
  /**
   * Obtiene todos los pedidos registrados en el sistema.
   * @returns Promesa con lista de pedidos
   */
  listar: async (): Promise<Pedido[]> => {
    const pedidos = await api.get('/pedido') as Pedido[];
    return pedidos.map(parsePedidoDates);
  },

  /**
   * Obtiene los productos (detalles) asociados a un pedido.
   * @param id ID del pedido
   * @returns Promesa con la lista de detalles
   */
  listarDetalles: async (id: number): Promise<DetallePedido[]> => {
    return await api.get(`/pedido/${id}/detalles`) as unknown as DetallePedido[];
  },

  /**
   * Crea un pedido completo (cabecera + detalles) en una sola transacción.
   * @param pedido Objeto Pedido con los datos
   * @param detalles Lista de productos del pedido
   * @returns Promesa con el ID del pedido creado
   */
  crearCompleto: async (pedido: Pedido, detalles: DetallePedidoArray[]): Promise<number> => {
    const payload = {
      pedido: {
        idPedido: pedido.idPedido, // Incluir ID para edición
        idCliente: pedido.cliente?.idCliente,
        idUsuario: pedido.usuarioResponsable?.idUsuario,
        // Revertido: enviar como epoch millis (compatibilidad anterior FE->BE)
        fechaProgramada: new Date(pedido.fechaProgramada).getTime(),
        estado: pedido.estado,
        pagado: pedido.pagado
      },
      detalles: detalles
    };
    return await api.post('/pedido', payload) as unknown as number;
  },

  /**
   * Actualiza el estado de flujo del pedido (ej: Pendiente -> En Proceso).
   * @param id ID del pedido
   * @param estado Nuevo código de estado
   * @param [idUsuario] ID del usuario que realiza el cambio
   * @returns Promesa con resultado de operación
   */
  actualizarEstado: async (id: number, estado: string, idUsuario?: number): Promise<number> => {
    return await api.put(`/pedido/${id}/estado`, { estado, idUsuario }) as unknown as number;
  },

  /**
   * Marca un pedido como pagado.
   * @param id ID del pedido
   * @returns Promesa con resultado de operación
   */
  marcarPagado: async (id: number): Promise<number> => {
    return await api.put(`/pedido/${id}/pagado`) as unknown as number;
  },

  /**
   * Elimina un pedido por completo.
   * @param id ID del pedido
   * @returns Promesa con resultado de operación
   */
  eliminar: async (id: number): Promise<number> => {
    return await api.delete(`/pedido/${id}`) as unknown as number;
  },

};
