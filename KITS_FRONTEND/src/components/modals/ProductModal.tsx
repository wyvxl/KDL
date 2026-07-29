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
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '12px',
        width: '90%', maxWidth: '500px',
        maxHeight: '80vh', // Altura máxima para el modal
        display: 'flex', flexDirection: 'column', // Layout de columna
        border: '1px solid var(--border)',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)', flexShrink: 0 }}>
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '1rem', overflowY: 'auto', paddingRight: '1rem' }}>
          {/* Nombre */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)',
                minHeight: '80px', resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Precio */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Precio *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Unidad Medida */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Unidad de Medida *
              </label>
              <select
                required
                value={formData.unidadMedida}
                onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
                }}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Stock Actual */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Stock Actual *
              </label>
              <input
                type="number"
                required
                value={formData.stockActual}
                onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Stock Mínimo */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Stock Mínimo *
              </label>
              <input
                type="number"
                required
                value={formData.stockMinimo}
                onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Checkbox Activo */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', width: 'fit-content' }}>
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo === 'S'}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 'S' : 'N' })}
                style={{ transform: 'scale(1.2)', margin: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Producto Activo</span>
            </label>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
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
