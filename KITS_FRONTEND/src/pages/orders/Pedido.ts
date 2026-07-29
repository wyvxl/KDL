import type { Cliente } from '../clients';
import type { Usuario } from '../users';
import type { Producto } from '../products';

/** interfaz para el objeto Pedido completo */
export interface Pedido {
  idPedido: number | null;
  cliente?: Cliente; // Referencia al objeto Cliente
  usuarioResponsable?: Usuario; // Referencia al Usuario que gestiona
  fechaPedido?: string | Date; // Fecha de creación (automática en backend)
  fechaProgramada: string; // Fecha solicitada para cumplimiento
  fechaEntrega?: string | Date; // Fecha real de entrega
  estado: string; // PENDIENTE, EN_PROCESO, ENTREGADO
  pagado?: boolean; // Estado de pago
  total: number; // Monto total calculado
}

/** Interfaz para el detalle (item) de un pedido cuando se consulta */
export interface DetallePedido {
  idPedido: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
}

/** Interfaz simplificada para envío masivo de detalles al crear/editar */
export interface DetallePedidoArray {
  idProducto: number;
  cantidad: number;
  precio: number;
}

/**
 * Línea del parte de producción de cocina para una fecha.
 * Responde a "¿qué tengo que hornear para el jueves?".
 */
export interface ProduccionRequerida {
  idProducto: number;
  nombre: string;
  unidadMedida: string;
  stockActual: number;
  /** Unidades de pedidos del día aún PENDIENTES (todavía no salieron del inventario). */
  porPreparar: number;
  /** Unidades de pedidos del día ya tomados por cocina (su stock ya se descontó). */
  yaAlistado: number;
  /** Cuánto falta hornear para cubrir `porPreparar` con el stock actual. */
  faltante: number;
}
