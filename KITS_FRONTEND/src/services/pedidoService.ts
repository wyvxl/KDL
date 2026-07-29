import api from './api';
import type { Pedido, DetallePedido, DetallePedidoArray, ProduccionRequerida } from '../pages/orders';

// Función para convertir campos de fecha de string a Date
const parsePedidoDates = (pedido: Pedido): Pedido => {
  return {
    ...pedido,
    // fechaProgramada llega ya como 'YYYY-MM-DD' (@JsonFormat en Pedido.java) y se deja
    // como string: es un día de calendario, no un instante, y convertirlo a Date lo
    // sometería a la zona horaria sin necesidad.
    // Intentar convertir fechaPedido si existe
    fechaPedido: pedido.fechaPedido ? new Date(pedido.fechaPedido) : undefined,
    // Intentar convertir fechaEntrega si existe
    fechaEntrega: pedido.fechaEntrega ? new Date(pedido.fechaEntrega) : undefined,
  };
};

/**
 * Normaliza la fecha programada a 'YYYY-MM-DD' antes de mandarla al backend.
 *
 * No se usa `new Date(fecha).getTime()`: el navegador interpreta 'YYYY-MM-DD' como
 * medianoche UTC, y al pasarlo a la zona del servidor (UTC-6) la fecha se guardaba un
 * día antes. Como además el formulario se rellena con la fecha ya guardada, cada
 * edición del pedido la corría otro día hacia atrás.
 */
const aFechaISO = (fecha: string | Date): string => {
  if (fecha instanceof Date) {
    // Componentes locales: toISOString() volvería a pasar por UTC.
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
  return fecha.slice(0, 10);
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
        // No se manda idUsuario: el backend toma el responsable del token. Enviarlo
        // permitiría atribuirle el pedido a otra persona.
        // Día de calendario, sin conversiones de zona horaria de por medio.
        fechaProgramada: aFechaISO(pedido.fechaProgramada),
        estado: pedido.estado,
        pagado: pedido.pagado
      },
      detalles: detalles
    };
    return await api.post('/pedido', payload) as unknown as number;
  },

  /**
   * Parte de producción de cocina para una fecha: qué hay que hornear ese día.
   * @param fecha Fecha en formato 'YYYY-MM-DD'
   * @returns Promesa con las líneas del parte, agrupadas por producto
   */
  produccion: async (fecha: string): Promise<ProduccionRequerida[]> => {
    return await api.get('/pedido/produccion', { params: { fecha } }) as unknown as ProduccionRequerida[];
  },

  /**
   * Actualiza el estado de flujo del pedido (ej: Pendiente -> En Proceso).
   *
   * El pedido queda a nombre del usuario de la sesión: el backend lo toma del token,
   * no hace falta (ni se debe) mandarlo.
   *
   * @param id ID del pedido
   * @param estado Nuevo código de estado
   * @returns Promesa con resultado de operación
   */
  actualizarEstado: async (id: number, estado: string): Promise<number> => {
    return await api.put(`/pedido/${id}/estado`, { estado }) as unknown as number;
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
