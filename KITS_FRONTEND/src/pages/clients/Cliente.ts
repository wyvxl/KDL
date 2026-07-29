/**
 * Interfaz que representa la estructura de un Cliente en el sistema.
 * Utilizada para tipar los datos de clientes en el frontend.
 */
export interface Cliente {
  /**
   * Identificador único del cliente. Es opcional al crear.
   */
  idCliente?: number;
  /**
   * Nombre completo del cliente.
   */
  nombre: string;
  /**
   * Número de teléfono de contacto del cliente.
   */
  telefono: string;
  /**
   * Dirección de domicilio o entrega del cliente.
   */
  direccion: string;
  /**
   * Correo electrónico del cliente.
   */
  email: string;
  /**
   * Notas adicionales o comentarios sobre el cliente.
   */
  notas?: string;
  /**
   * Estado del cliente: 'S' activo, 'N' dado de baja.
   * Un cliente dado de baja conserva su historial de pedidos pero deja de ofrecerse
   * al tomar pedidos nuevos.
   */
  activo?: string;
}
