/**
 * Interfaz que representa la estructura de un Cliente en el sistema.
 * Utilizada para tipar los datos de clientes en el frontend.
 */
export interface Cliente {
  /**
   * Identificador único del cliente. Es opcional al crear un nuevo cliente,
   * ya que el backend lo asignará.
   */
  idCliente?: number;
  /**
   * Nombre completo del cliente. Campo obligatorio.
   */
  nombre: string;
  /**
   * Número de teléfono de contacto del cliente. Campo obligatorio.
   */
  telefono: string;
  /**
   * Dirección de domicilio o entrega del cliente. Campo obligatorio.
   */
  direccion: string;
  /**
   * Correo electrónico del cliente. Campo obligatorio.
   */
  email: string;
  /**
   * Notas adicionales o comentarios sobre el cliente. Es opcional.
   */
  notas?: string;
}
