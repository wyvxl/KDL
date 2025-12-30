import api from './api';
import type { Producto, AjusteStock } from '../pages/products';

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
   * Registra un ajuste de stock (entrada o salida de mercancía).
   * @param ajuste Datos del movimiento
   */
  ajustarStock: async (ajuste: AjusteStock): Promise<void> => {
    await api.post('/producto/ajustar-stock', ajuste);
  }
};
