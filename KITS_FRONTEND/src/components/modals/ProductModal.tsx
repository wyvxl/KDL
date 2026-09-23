import React, { useState } from 'react';
import { productoService } from '../../services/productoService';
import type { Producto } from '../../pages/products';
import { useToast } from '../../hooks/useToast';
import Toast from '../ui/Toast';

interface ProductModalProps {
  isOpen: boolean;            // Control de visibilidad
  onClose: () => void;        // Acción cerrar
  onProductAdded: () => void; // Callback éxito
  product?: Producto | null;  // Producto a editar (null = nuevo)
}

/**
 * Modal para gestión de Productos (Crear/Editar).
 * Incluye campos para datos básicos, precios y control de stock.
 */
const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onProductAdded, product }) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stockActual: '',
    stockMinimo: '',
    unidadMedida: '',
    activo: 'S' // Nuevo campo: 'S' por defecto para nuevos productos
  });

  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Efecto: Cargar datos al abrir modal si hay producto seleccionado
  /* eslint-disable react-hooks/set-state-in-effect -- reset intencional del formulario al cambiar el producto/abrir */
  React.useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        precio: product.precio.toString(),
        stockActual: product.stockActual.toString(),
        stockMinimo: product.stockMinimo.toString(),
        unidadMedida: product.unidadMedida,
        activo: product.activo || 'S' // Cargar estado activo del producto existente
      });
    } else {
      // Limpiar formulario para nuevo registro
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stockActual: '',
        stockMinimo: '',
        unidadMedida: '',
        activo: 'S' // Asegurar que el estado por defecto sea 'S'
      });
    }
  }, [product, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Manejo de envío
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construir objeto Producto con conversiones numéricas
      const producto: Producto = {
        idProducto: product ? product.idProducto : null,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        stockActual: parseInt(formData.stockActual),
        stockMinimo: parseInt(formData.stockMinimo),
        unidadMedida: formData.unidadMedida,
        activo: formData.activo // Incluir el estado activo
      };

      // Guardar en backend con manejo de errores específico
      let result: number | undefined = undefined;
      try {
        result = await productoService.guardar(producto);
      } catch (serviceError) {
        console.error('Error en servicio de productos:', serviceError);
        const errorMsg = serviceError instanceof Error ? serviceError.message : 'Error de conexión';
        showToast(`Error al comunicarse con el servidor: ${errorMsg}`, 'error');
        setLoading(false);
        return;
      }

      // Validar resultado del servicio
      if (!result || typeof result !== 'number' || result <= 0) {
        showToast('Error: El producto no se pudo guardar', 'error');
        setLoading(false);
        return;
      }

      // El cierre va dentro del timeout para que dé tiempo de ver el toast: el modal
      // contiene al propio Toast, así que cerrarlo aquí mismo lo desmontaría antes de
      // que se llegara a mostrar (y refrescaría la tabla dos veces).
      showToast(product ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente', 'success');
      setTimeout(() => {
        onProductAdded(); // Refrescar tabla padre
        onClose();        // Cerrar modal
      }, 1500);
    } catch (error) {
      console.error('Error saving product:', error);
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      showToast(`Error al guardar el producto: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay">
      <div className="app-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div className="app-modal-header">
          <h2 id="product-modal-title" className="app-modal-title">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="app-modal-form">
          <div className="app-modal-body">
            {/* Nombre */}
            <div>
              <label className="field-label" htmlFor="producto-nombre">Nombre *</label>
              <input
                id="producto-nombre"
                type="text"
                required
                className="field-input"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="field-label" htmlFor="producto-descripcion">Descripción</label>
              <textarea
                id="producto-descripcion"
                className="field-input"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div className="field-row">
              {/* Precio */}
              <div>
                <label className="field-label" htmlFor="producto-precio">Precio *</label>
                <input
                  id="producto-precio"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="field-input"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                />
              </div>

              {/* Unidad Medida */}
              <div>
                <label className="field-label" htmlFor="producto-unidad">Unidad de Medida *</label>
                <select
                  id="producto-unidad"
                  required
                  className="field-input"
                  value={formData.unidadMedida}
                  onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                >
                  <option value="">Seleccionar unidad</option>
                  <option value="unidad">Unidad</option>
                  <option value="kg">Kilogramo</option>
                  <option value="g">Gramo</option>
                  <option value="lb">Libra</option>
                  <option value="litro">Litro</option>
                  <option value="ml">Mililitro</option>
                  <option value="metro">Metro</option>
                  <option value="cm">Centímetro</option>
                  <option value="caja">Caja</option>
                  <option value="paquete">Paquete</option>
                  <option value="docena">Docena</option>
                  <option value="par">Par</option>
                </select>
              </div>
            </div>

            <div className="field-row">
              {/* Stock Actual */}
              <div>
                <label className="field-label" htmlFor="producto-stock">Stock Actual *</label>
                <input
                  id="producto-stock"
                  type="number"
                  required
                  min="0"
                  inputMode="numeric"
                  className="field-input"
                  value={formData.stockActual}
                  onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                />
              </div>

              {/* Stock Mínimo */}
              <div>
                <label className="field-label" htmlFor="producto-stock-minimo">Stock Mínimo *</label>
                <input
                  id="producto-stock-minimo"
                  type="number"
                  required
                  min="0"
                  inputMode="numeric"
                  className="field-input"
                  value={formData.stockMinimo}
                  onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                />
              </div>
            </div>

            {/* Checkbox Activo */}
            <label className="field-check">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo === 'S'}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 'S' : 'N' })}
              />
              Producto Activo
            </label>
          </div>

          {/* Botones: fuera del área que se desplaza, siempre visibles */}
          <div className="app-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Guardando...' : 'Guardar'}
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

export default ProductModal;
