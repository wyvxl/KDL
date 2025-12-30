import React from 'react';
import { type Rol } from '../../services/rolService';
import { useRolForm } from '../../hooks/useRolForm';
import './RolModal.css';

interface RolModalProps {
  isOpen: boolean;                    // Visibilidad
  onClose: () => void;                // Acción cerrar
  onSuccess: (nuevoRol: Rol) => void; // Callback al crear éxito
}

/**
 * Modal para creación de nuevos Roles.
 * Permite definir nombre y descripción para la gestión de permisos.
 */
const RolModal: React.FC<RolModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { formData, loading, error, handleChange, handleClose, handleSubmit } = useRolForm(onSuccess, onClose);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">Nuevo Rol</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Nombre Rol */}
          <div className="form-group">
            <label>Nombre del Rol *</label>
            <input
              type="text"
              name="nombreRol"
              value={formData.nombreRol}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label>Descripción</label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Mensaje de Error */}
          {error && <div className="error-message">{error}</div>}

          {/* Botones */}
          <div className="button-group">
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolModal;
