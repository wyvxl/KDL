import api from './api';
import type { Producto, AjusteStock, DisponibilidadProducto } from '../pages/products';

/**
 * Servicio para la gestión de Productos e Inventario.
 */
export const productoService = {
  /**
   * Obtiene el catálogo completo de productos.
   * @returns Promesa con lista de productos
   */
  listar: async (): Promise<Producto[]> => {
    return await api.get('/producto') as unknown as Producto[];
  },

  /**
   * Crea o actualiza un producto en el catálogo.
   * @param producto Datos del producto
   * @returns Promesa con el ID del producto
   */
  guardar: async (producto: Producto): Promise<number> => {
    try {
      const response = await api.post('/producto', producto);
      return response as unknown as number;
    } catch (error) {
      console.error('Error al guardar producto:', error);
      throw error;
    }
  },

  /**
   * Catálogo con la disponibilidad de cada producto para una fecha.
   *
   * Es lo que se consulta al armar un pedido: además del stock físico devuelve cuánto
   * está comprometido en pedidos pendientes para esa fecha y cuánto queda libre.
   *
   * @param fecha         Fecha programada del pedido, en formato 'YYYY-MM-DD'
   * @param excluirPedido Pedido en edición, para no contarlo contra sí mismo
   * @returns Promesa con los productos activos y su disponibilidad
   */
  disponibilidad: async (fecha: string, excluirPedido?: number | null): Promise<DisponibilidadProducto[]> => {
    const params: Record<string, string | number> = { fecha };
    if (excluirPedido) {
      params.excluirPedido = excluirPedido;
    }
    return await api.get('/producto/disponibilidad', { params }) as unknown as DisponibilidadProducto[];
  },

  /**
   * Registra un ajuste de stock (entrada o salida de mercancía).
   * @param ajuste Datos del movimiento
   */
  ajustarStock: async (ajuste: AjusteStock): Promise<void> => {
    await api.post('/producto/ajustar-stock', ajuste);
  }
};
