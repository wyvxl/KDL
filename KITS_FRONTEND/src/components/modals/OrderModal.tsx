import React, { useState, useEffect } from 'react';
import { pedidoService } from '../../services/pedidoService';
import { clienteService } from '../../services/clienteService';
import { productoService } from '../../services/productoService';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Toast from '../ui/Toast';
import type { Pedido } from '../../pages/orders';
import type { Cliente } from '../../pages/clients';
import type { Producto as ProductoCompleto } from '../../pages/products';

// Definición de las propiedades que acepta el modal
interface OrderModalProps {
  isOpen: boolean;       // Controla si el modal está visible
  onClose: () => void;   // Función para cerrar el modal
  onOrderAdded: () => void; // Callback al guardar exitosamente
  order?: Pedido | null; // Pedido a editar (null si es nuevo)
}

// Componente Modal para Crear/Editar Pedidos
const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onOrderAdded, order }) => {
  // Estado para los campos del formulario
  const [formData, setFormData] = useState({
    idCliente: '',
    fechaProgramada: '',
    pagado: false
  });

  // Listas de datos para dropdowns
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<ProductoCompleto[]>([]);

  // Estado para manejar la lista de productos agregados al pedido actual
  const [selectedProducts, setSelectedProducts] = useState<{ producto: ProductoCompleto, cantidad: number, precio: number }[]>([]);

  // Estados de carga y errores
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [error, setError] = useState<string>('');

  // Carga la lista de clientes desde el backend
  const loadClientes = async () => {
    try {
      setLoadingClientes(true);
      const data = await clienteService.listar();
      setClientes(data);
      return data;
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    } finally {
      setLoadingClientes(false);
    }
  };

  // Carga la lista de productos disponibles desde el backend
  const loadProductos = async () => {
    try {
      setLoadingProductos(true);
      const data = await productoService.listar();
      setProductos(data);
      return data;
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    } finally {
      setLoadingProductos(false);
    }
  };

  // Función principal para inicializar el formulario al abrir el modal
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Cargamos clientes y productos en paralelo
      await Promise.all([loadClientes(), loadProductos()]);

      // Revertido: no usar helper local; se vuelve a usar toISOString().split('T')[0]

      if (order && order.idPedido) {
        // --- MODO EDICIÓN ---
        // Rellenamos el formulario con los datos del pedido existente
        setFormData({
          idCliente: order.cliente?.idCliente?.toString() ?? '',
          // Revertido: derivar fecha ISO estándar para compatibilidad previa
          fechaProgramada: new Date(order.fechaProgramada).toISOString().split('T')[0],
          pagado: !!order.pagado
        });

        // Obtenemos los detalles (productos) del pedido para rellenar la lista
        const detalles = await pedidoService.listarDetalles(order.idPedido);
        const productosDelPedido = detalles.map(detalle => {
          // Buscamos el producto completo en la lista ya cargada para tener todos los datos
          const productoOriginal = productos.find(p => p.idProducto === detalle.producto.idProducto);

          // Si el producto no se encuentra en la lista actual (pudo ser eliminado),
          // creamos un objeto de respaldo para mantener la consistencia del pedido.
          const producto: ProductoCompleto = productoOriginal || {
            idProducto: detalle.producto.idProducto,
            nombre: detalle.producto.nombre ?? `(Producto no encontrado)`,
            descripcion: detalle.producto.descripcion ?? '',
            precio: detalle.producto.precio ?? 0,
            stockActual: 0, // No es relevante para la edición del pedido
            stockMinimo: 0,
            unidadMedida: '',
            activo: 'N' // Asumimos inactivo si no está en la lista principal
          };

          return {
            producto,
            cantidad: detalle.cantidad,
            precio: detalle.precioUnitario
          };
        });

        setSelectedProducts(productosDelPedido);

      } else {
        // --- MODO CREACIÓN ---
        // Reseteamos el formulario a valores por defecto
        setFormData({
          idCliente: '',
          // Revertido: usar toISOString().split('T')[0] (UTC)
          fechaProgramada: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
          pagado: false
        });
        setSelectedProducts([]);
      }
    } catch (error) {
      console.error("Error loading initial data for modal:", error);

      // Determinar tipo de error y mensaje apropiado
      const isNetworkError = error instanceof Error &&
        (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('ECONNREFUSED'));

      if (isNetworkError) {
        setError('Sin conexión al servidor. Verifique su conexión e inténtelo nuevamente.');
      } else if (error instanceof Error) {
        setError(`Error al cargar datos: ${error.message}`);
      } else {
        setError('Error inesperado al cargar los datos del formulario.');
      }

      // Mantener datos existentes si es posible
      if (clientes.length === 0 && productos.length === 0) {
        // Si no hay datos, mostrar mensaje más específico
        setError((prev: string) => prev + ' No se pudieron cargar clientes ni productos.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto que se dispara cuando se abre el modal o cambia el pedido seleccionado
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- carga/reset intencional al abrir el modal */
  useEffect(() => {
    if (isOpen) {
      setError(''); // Limpiar errores previos
      void loadInitialData();
    }
  }, [isOpen, order]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  // Función para reintentar carga de datos
  const retryLoadData = () => {
    setError('');
    void loadInitialData();
  };

  // Agrega un producto a la lista local del pedido
  const addProduct = (producto: ProductoCompleto) => {
    const exists = selectedProducts.find(p => p.producto.idProducto === producto.idProducto);
    if (!exists) {
      setSelectedProducts([...selectedProducts, {
        producto,
        cantidad: 1, // Cantidad por defecto
        precio: producto.precio // Precio base del producto
      }]);
    }
  };

  // Elimina un producto de la lista local
  const removeProduct = (idProducto: number | null) => {
    setSelectedProducts(selectedProducts.filter(p => p.producto.idProducto !== idProducto));
  };

  // Actualiza la cantidad de un producto en la lista
  const updateProductQuantity = (idProducto: number | null, cantidad: number) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.producto.idProducto === idProducto ? { ...p, cantidad } : p
    ));
  };

  // Actualiza el precio unitario (permite descuentos o ajustes manuales)
  const updateProductPrice = (idProducto: number | null, precio: number) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.producto.idProducto === idProducto ? { ...p, precio } : p
    ));
  };

  // Calcula el total del pedido sumando (cantidad * precio) de cada item
  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => total + (item.cantidad * item.precio), 0);
  };

  // Maneja el envío del formulario (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Obtenemos el usuario responsable (quien crea/edita)
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.idUsuario) {
        showToast('Usuario no autenticado o ID de usuario no encontrado', 'error');
        return;
      }

      // Construimos el objeto Pedido
      const pedido: Pedido = {
        idPedido: order ? order.idPedido : null,
        cliente: {
          idCliente: parseInt(formData.idCliente),
          nombre: '',
          telefono: '',
          direccion: '',
          email: ''
        },
        usuarioResponsable: {
          idUsuario: currentUser.idUsuario,
          nombreUsuario: '',
          nombreCompleto: '',
          email: '',
          idRol: 0
        },
        fechaProgramada: formData.fechaProgramada,
        estado: order ? order.estado : 'PENDIENTE', // Nuevo pedido inicia en PENDIENTE
        total: calculateTotal(),
        pagado: formData.pagado
      };

      if (order?.idPedido) {
        // Editar pedido existente
        const detallesArray = selectedProducts.map(item => ({
          idProducto: item.producto.idProducto!,
          cantidad: item.cantidad,
          precio: item.precio
        }));

        await pedidoService.crearCompleto(pedido, detallesArray);
      } else {
        // Crear nuevo pedido completo
        const detallesArray = selectedProducts.map(item => ({
          idProducto: item.producto.idProducto!,
          cantidad: item.cantidad,
          precio: item.precio
        }));

        await pedidoService.crearCompleto(pedido, detallesArray);
      }

      showToast(order ? 'Pedido actualizado exitosamente' : `Pedido creado exitosamente`, 'success');
      setTimeout(() => {
        onOrderAdded();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving order:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast(`Error al guardar el pedido: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '12px',
        width: '90%', maxWidth: '600px', maxHeight: '90vh',
        border: '1px solid #E5E7EB',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)', flexShrink: 0 }}>
          {order ? 'Editar Pedido' : 'Nuevo Pedido'}
        </h2>

        {/* Mensaje de Error con opción de reintentar */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '1rem',
            flexShrink: 0
          }}>
            <div style={{ color: '#dc2626', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Error al cargar datos
            </div>
            <div style={{ color: '#7f1d1d', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
            <button
              type="button"
              onClick={retryLoadData}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Cargando...' : 'Reintentar'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Selección de Cliente */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Cliente *
              </label>
              {loadingClientes ? (
                <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  Cargando clientes...
                </div>
              ) : (
                <select
                  required
                  value={formData.idCliente}
                  onChange={(e) => setFormData({ ...formData, idCliente: e.target.value })}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                    border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
                  }}
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.idCliente} value={String(cliente.idCliente || '')}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selección de Fecha */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Fecha Programada *
              </label>
              <input
                type="date"
                required
                value={formData.fechaProgramada}
                onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Checkbox Pagado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
              <input
                type="checkbox"
                id="checkPagado"
                checked={formData.pagado}
                onChange={(e) => setFormData({ ...formData, pagado: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="checkPagado" style={{ cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)', fontWeight: '500' }}>
                Pedido Pagado
              </label>
            </div>

            {/* Selección de Productos */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Productos
              </label>

              {loadingProductos ? (
                <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Cargando productos...</div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <select
                    onChange={(e) => {
                      const producto = productos.find(p => p.idProducto === parseInt(e.target.value));
                      if (producto) {
                        addProduct(producto);
                        e.target.value = ''; // Reset select
                      }
                    }}
                    style={{
                      width: '100%', padding: '0.75rem', borderRadius: '8px',
                      border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">Agregar producto...</option>
                    {/* Filtramos productos ya seleccionados para no duplicar en la lista visual */}
                    {productos.filter(p => !selectedProducts.find(sp => sp.producto.idProducto === p.idProducto))
                      .map((producto) => (
                        <option key={producto.idProducto} value={String(producto.idProducto || '')}>
                          {producto.nombre} - ₡{producto.precio}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Lista de productos seleccionados (con cantidad y precio editable) */}
              {selectedProducts.length > 0 && (
                <div style={{
                  border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1rem',
                  backgroundColor: '#F9FAFB', maxHeight: '300px', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column'
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', flexShrink: 0 }}>Productos Seleccionados:</h4>
                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                    {selectedProducts.map((item, index) => (
                      <div key={index} style={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto',
                        gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem',
                        padding: '0.5rem', backgroundColor: '#FFFFFF', borderRadius: '6px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <span style={{ color: 'var(--text-primary)' }}>{item.producto.nombre}</span>
                        {/* Input Cantidad */}
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => updateProductQuantity(item.producto.idProducto, parseInt(e.target.value) || 1)}
                          style={{
                            padding: '0.25rem', borderRadius: '4px', border: '1px solid #D1D5DB',
                            backgroundColor: '#FFFFFF', color: 'var(--text-primary)', width: '60px'
                          }}
                        />
                        {/* Input Precio */}
                        <input
                          type="number"
                          step="0.01"
                          value={item.precio}
                          onChange={(e) => updateProductPrice(item.producto.idProducto, parseFloat(e.target.value) || 0)}
                          style={{
                            padding: '0.25rem', borderRadius: '4px', border: '1px solid #D1D5DB',
                            backgroundColor: '#FFFFFF', color: 'var(--text-primary)', width: '80px'
                          }}
                        />
                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => removeProduct(item.producto.idProducto)}
                          style={{
                            padding: '0.25rem 0.5rem', backgroundColor: 'var(--color-danger)',
                            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Total Calculado */}
                  <div style={{
                    padding: '0.5rem', backgroundColor: 'var(--accent-bg)', borderRadius: '6px',
                    textAlign: 'right', flexShrink: 0
                  }}>
                    <strong>Total: ₡{calculateTotal().toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div style={{
            padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '8px',
            border: '1px solid #E5E7EB', flexShrink: 0
          }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <strong>Nota:</strong> {order ? 'Modifica la información del pedido.' : 'Selecciona los productos y cantidades para el pedido. El total se calculará automáticamente.'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingClientes || loadingProductos}
              className="btn btn-primary"
            >
              {loading ? (order ? 'Actualizando...' : 'Creando...') : (order ? 'Actualizar Pedido' : 'Crear Pedido')}
            </button>
          </div>
        </form>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default OrderModal;
