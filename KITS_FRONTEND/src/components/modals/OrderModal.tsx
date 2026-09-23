import React, { useState } from 'react';
import { pedidoService } from '../../services/pedidoService';
import { clienteService } from '../../services/clienteService';
import { productoService } from '../../services/productoService';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Toast from '../ui/Toast';
import type { Pedido } from '../../pages/orders';
import type { Cliente } from '../../pages/clients';
import type { DisponibilidadProducto } from '../../pages/products';
import { diaLocal } from '../../utils/fechas';
import { formatoMoneda } from '../../utils/formato';
import { X } from 'lucide-react';
import './OrderModal.css';

// Definición de las propiedades que acepta el modal
interface OrderModalProps {
  isOpen: boolean;       // Controla si el modal está visible
  onClose: () => void;   // Función para cerrar el modal
  onOrderAdded: () => void; // Callback al guardar exitosamente
  order?: Pedido | null; // Pedido a editar (null si es nuevo)
}

/** Línea del pedido que se está armando. */
interface LineaPedido {
  producto: DisponibilidadProducto;
  cantidad: number;
  precio: number;
}

/** Fecha de hoy como 'YYYY-MM-DD', en hora local (sin pasar por UTC). */
const hoyISO = (): string => diaLocal(new Date());

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
  const [productos, setProductos] = useState<DisponibilidadProducto[]>([]);

  // Productos agregados al pedido actual
  const [selectedProducts, setSelectedProducts] = useState<LineaPedido[]>([]);

  // Estados de carga y errores
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [error, setError] = useState<string>('');

  // Carga la lista de clientes desde el backend
  const loadClientes = async (): Promise<Cliente[]> => {
    try {
      setLoadingClientes(true);
      const data = await clienteService.listar();
      setClientes(data);
      return data;
    } finally {
      setLoadingClientes(false);
    }
  };

  /**
   * Carga el catálogo con la disponibilidad para la fecha del pedido.
   *
   * Se excluye el propio pedido en edición para que sus cantidades no se cuenten
   * como comprometidas contra sí mismo.
   */
  const loadProductos = async (fecha: string): Promise<DisponibilidadProducto[]> => {
    try {
      setLoadingProductos(true);
      const data = await productoService.disponibilidad(fecha, order?.idPedido);
      setProductos(data);
      return data;
    } finally {
      setLoadingProductos(false);
    }
  };

  // Función principal para inicializar el formulario al abrir el modal
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // La fecha decide qué disponibilidad pedir, así que se resuelve primero.
      // fechaProgramada llega del backend ya como 'YYYY-MM-DD'.
      const fecha = order?.idPedido ? String(order.fechaProgramada).slice(0, 10) : hoyISO();

      setFormData({
        idCliente: order?.cliente?.idCliente?.toString() ?? '',
        fechaProgramada: fecha,
        pagado: !!order?.pagado
      });

      const [, catalogo] = await Promise.all([loadClientes(), loadProductos(fecha)]);

      if (order?.idPedido) {
        // --- MODO EDICIÓN: rellenar las líneas con los detalles guardados ---
        const detalles = await pedidoService.listarDetalles(order.idPedido);

        setSelectedProducts(detalles.map(detalle => {
          // Se busca en `catalogo` (el valor recién devuelto) y no en el estado
          // `productos`, que en este punto todavía tiene el valor del render anterior.
          const productoOriginal = catalogo.find(p => p.idProducto === detalle.producto.idProducto);

          // Si el producto ya no está en el catálogo (se desactivó), se arma uno de
          // respaldo con lo que devuelve el detalle para no perder la línea.
          const producto: DisponibilidadProducto = productoOriginal ?? {
            idProducto: detalle.producto.idProducto,
            nombre: detalle.producto.nombre ?? '(Producto no encontrado)',
            descripcion: detalle.producto.descripcion ?? '',
            precio: detalle.precioUnitario,
            stockActual: 0,
            stockMinimo: 0,
            unidadMedida: '',
            activo: 'N',
            comprometido: 0,
            disponible: 0
          };

          return { producto, cantidad: detalle.cantidad, precio: detalle.precioUnitario };
        }));
      } else {
        // --- MODO CREACIÓN ---
        setSelectedProducts([]);
      }
    } catch (err) {
      console.error('Error loading initial data for modal:', err);

      const isNetworkError = err instanceof Error &&
        (err.message.includes('Network') || err.message.includes('fetch') || err.message.includes('ECONNREFUSED'));

      if (isNetworkError) {
        setError('Sin conexión al servidor. Verifique su conexión e inténtelo nuevamente.');
      } else if (err instanceof Error) {
        setError(`Error al cargar datos: ${err.message}`);
      } else {
        setError('Error inesperado al cargar los datos del formulario.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto que se dispara cuando se abre el modal o cambia el pedido seleccionado
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- carga/reset intencional al abrir el modal */
  React.useEffect(() => {
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

  /**
   * Al cambiar la fecha hay que recalcular la disponibilidad: lo comprometido depende
   * del día. Se recarga aquí y no en un efecto para no competir con la carga inicial.
   */
  const handleFechaChange = (nuevaFecha: string) => {
    setFormData(prev => ({ ...prev, fechaProgramada: nuevaFecha }));
    if (!nuevaFecha) return;

    void loadProductos(nuevaFecha)
      .then(catalogo => {
        // Refrescar la disponibilidad de las líneas ya agregadas.
        setSelectedProducts(prev => prev.map(linea => {
          const actualizado = catalogo.find(p => p.idProducto === linea.producto.idProducto);
          return actualizado ? { ...linea, producto: actualizado } : linea;
        }));
      })
      .catch(err => console.error('Error recargando disponibilidad:', err));
  };

  // Agrega un producto a la lista local del pedido
  const addProduct = (producto: DisponibilidadProducto) => {
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

  const esParaHoy = formData.fechaProgramada === hoyISO();
  const lineasQueExceden = selectedProducts.filter(l => l.cantidad > l.producto.disponible);

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

      // El responsable no se envía: el backend lo toma del token de la sesión.
      const pedido: Pedido = {
        idPedido: order ? order.idPedido : null,
        cliente: {
          idCliente: parseInt(formData.idCliente),
          nombre: '',
          telefono: '',
          direccion: '',
          email: ''
        },
        fechaProgramada: formData.fechaProgramada,
        estado: order ? order.estado : 'PENDIENTE', // Nuevo pedido inicia en PENDIENTE
        total: calculateTotal(),
        pagado: formData.pagado
      };

      const detallesArray = selectedProducts.map(item => ({
        idProducto: item.producto.idProducto!,
        cantidad: item.cantidad,
        precio: item.precio
      }));

      await pedidoService.crearCompleto(pedido, detallesArray);

      showToast(order ? 'Pedido actualizado exitosamente' : 'Pedido creado exitosamente', 'success');
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

  // Al editar, el cliente del pedido puede estar dado de baja: la lista solo trae activos
  // y el select quedaba en "Seleccionar cliente", obligando a cambiarlo para poder guardar.
  const clienteDelPedido = order?.cliente;
  const opcionesClientes = clienteDelPedido?.idCliente != null
    && !clientes.some(c => c.idCliente === clienteDelPedido.idCliente)
    ? [...clientes, { ...clienteDelPedido, nombre: `${clienteDelPedido.nombre ?? 'Cliente'} (dado de baja)` }]
    : clientes;

  return (
    <div className="app-modal-overlay">
      <div className="app-modal app-modal-wide" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
        <div className="app-modal-header">
          <h2 id="order-modal-title" className="app-modal-title">
            {order ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h2>
        </div>

        {/* Mensaje de Error con opción de reintentar */}
        {error && (
          <div className="order-modal-error" role="alert">
            <strong>Error al cargar datos</strong>
            <p>{error}</p>
            <button type="button" className="btn btn-danger" onClick={retryLoadData} disabled={loading}>
              {loading ? 'Cargando...' : 'Reintentar'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="app-modal-form">
          <div className="app-modal-body">

            {/* Selección de Cliente */}
            <div>
              <label className="field-label" htmlFor="pedido-cliente">Cliente *</label>
              {loadingClientes ? (
                <div className="order-modal-cargando">Cargando clientes...</div>
              ) : (
                <select
                  id="pedido-cliente"
                  required
                  className="field-input"
                  value={formData.idCliente}
                  onChange={(e) => setFormData({ ...formData, idCliente: e.target.value })}
                >
                  <option value="">Seleccionar cliente</option>
                  {opcionesClientes.map((cliente) => (
                    <option key={cliente.idCliente} value={String(cliente.idCliente || '')}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selección de Fecha */}
            <div>
              <label className="field-label" htmlFor="pedido-fecha">Fecha Programada *</label>
              <input
                id="pedido-fecha"
                type="date"
                required
                className="field-input"
                value={formData.fechaProgramada}
                onChange={(e) => handleFechaChange(e.target.value)}
              />
            </div>

            {/* Checkbox Pagado */}
            <label className="field-check">
              <input
                type="checkbox"
                checked={formData.pagado}
                onChange={(e) => setFormData({ ...formData, pagado: e.target.checked })}
              />
              Pedido Pagado
            </label>

            {/* Selección de Productos */}
            <div>
              <label className="field-label" htmlFor="pedido-agregar-producto">Productos</label>

              {loadingProductos ? (
                <div className="order-modal-cargando">Cargando productos...</div>
              ) : (
                <select
                  id="pedido-agregar-producto"
                  className="field-input"
                  onChange={(e) => {
                    const producto = productos.find(p => p.idProducto === parseInt(e.target.value));
                    if (producto) {
                      addProduct(producto);
                      e.target.value = ''; // Reset select
                    }
                  }}
                >
                  <option value="">Agregar producto...</option>
                  {/* Filtramos productos ya seleccionados para no duplicar en la lista visual */}
                  {productos.filter(p => !selectedProducts.find(sp => sp.producto.idProducto === p.idProducto))
                    .map((producto) => (
                      <option key={producto.idProducto} value={String(producto.idProducto || '')}>
                        {producto.nombre} - {formatoMoneda(producto.precio)} (disp. {producto.disponible})
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* Lista de productos seleccionados (con cantidad y precio editable) */}
            {selectedProducts.length > 0 && (
              <div className="order-lineas">
                <h4>Productos seleccionados</h4>
                {selectedProducts.map((item) => {
                  const excede = item.cantidad > item.producto.disponible;
                  const id = item.producto.idProducto;
                  return (
                    <div key={id} className={`order-linea${excede ? ' excede' : ''}`}>
                      <div className="order-linea-producto">
                        <span className="order-linea-nombre">{item.producto.nombre}</span>
                        <span className="order-linea-disponible">
                          {excede
                            ? `Hay ${item.producto.disponible}: falta hornear ${item.cantidad - item.producto.disponible}`
                            : `Disponible: ${item.producto.disponible}`}
                        </span>
                      </div>
                      <label className="order-linea-campo">
                        <span>Cant.</span>
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={item.cantidad}
                          onChange={(e) => updateProductQuantity(id, parseInt(e.target.value) || 1)}
                        />
                      </label>
                      <label className="order-linea-campo">
                        <span>Precio</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={item.precio}
                          onChange={(e) => updateProductPrice(id, parseFloat(e.target.value) || 0)}
                        />
                      </label>
                      <button
                        type="button"
                        className="order-linea-quitar"
                        onClick={() => removeProduct(id)}
                        aria-label={`Quitar ${item.producto.nombre}`}
                        title="Quitar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
                {/* Total Calculado */}
                <div className="order-lineas-total">
                  Total: <strong>{formatoMoneda(calculateTotal())}</strong>
                </div>
              </div>
            )}

            <div className={`order-modal-nota${lineasQueExceden.length > 0 ? ' aviso' : ''}`}>
              {lineasQueExceden.length > 0 ? (
                <p>
                  <strong>Ojo:</strong> {lineasQueExceden.length === 1 ? 'un producto supera' : `${lineasQueExceden.length} productos superan`} lo
                  que hay disponible.{' '}
                  {esParaHoy
                    ? 'Como el pedido es para hoy, cocina tendrá que hornear antes de poder alistarlo.'
                    : 'Para una fecha futura es normal: se hornea ese día. El pedido se puede registrar igual.'}
                </p>
              ) : (
                <p>
                  <strong>Nota:</strong> el stock se descuenta cuando cocina toma el pedido, no ahora.
                  Lo que se muestra como disponible ya descuenta lo comprometido en otros pedidos pendientes.
                </p>
              )}
            </div>
          </div>

          <div className="app-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
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
