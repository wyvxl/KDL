/** interfaz que representa un Producto en el inventario */
export interface Producto {
  idProducto: number | null; // Null si es nuevo
  nombre: string;
  descripcion: string;
  precio: number;
  stockActual: number;
  stockMinimo: number; // Nivel de alerta de stock
  unidadMedida: string; // ej: 'kg', 'unidad'
  activo: string; // 'S' para activo, 'N' para inactivo
}

/** Interfaz para registrar movimientos de inventario */
export interface AjusteStock {
  idProducto: number;
  cantidad: number; // Siempre positiva; el sentido lo da 'movimiento'
  movimiento: 'ENTRADA' | 'SALIDA'; // ENTRADA = producción, SALIDA = merma
}

/**
 * Producto con su disponibilidad para una fecha concreta.
 *
 * Se usa al tomar un pedido para saber cuánto se puede prometer:
 *
 *   disponible = stockActual - comprometido
 *
 * `comprometido` son las cantidades de pedidos aún PENDIENTES para esa fecha o antes.
 * Los pedidos que cocina ya tomó no cuentan: su stock ya salió de `stockActual`.
 *
 * Para fechas futuras `disponible` es orientativo, no un tope: lo que falte se hornea
 * ese día. Solo es vinculante para pedidos del mismo día.
 */
export interface DisponibilidadProducto extends Producto {
  comprometido: number;
  disponible: number;
}
