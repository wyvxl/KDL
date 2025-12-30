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
