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
  cantidad: number; // Cantidad a sumar o restar (si es salida)
  movimiento: string; // Tipo: 'ENTRADA' o 'SALIDA'
}
