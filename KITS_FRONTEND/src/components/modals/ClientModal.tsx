import React, { useState } from 'react';
import { clienteService, type Cliente } from '../../services/clienteService';
import { useToast } from '../../hooks/useToast';
import Toast from '../ui/Toast';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
  client?: Cliente | null;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onClientAdded, client }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    email: '',
    notas: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Sincroniza el formulario con el cliente recibido al abrir el modal (o lo limpia si es nuevo).
  /* eslint-disable react-hooks/set-state-in-effect -- reset intencional del formulario al cambiar el cliente/abrir */
  React.useEffect(() => {
    if (client) {
      setFormData({
        nombre: client.nombre,
        telefono: client.telefono || '',
        direccion: client.direccion || '',
        email: client.email || '',
        notas: client.notas || ''
      });
    } else {
      setFormData({
        nombre: '',
        telefono: '',
        direccion: '',
        email: '',
        notas: ''
      });
    }
  }, [client, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleApiError = (serviceError: unknown) => {
    console.error('Error en servicio de clientes:', serviceError);

    const isNetworkError = serviceError instanceof Error &&
      (serviceError.message.includes('Network') || serviceError.message.includes('fetch') || serviceError.message.includes('ECONNREFUSED'));

    const isValidationError = serviceError instanceof Error &&
      (serviceError.message.includes('validation') || serviceError.message.includes('duplicate') || serviceError.message.includes('constraint'));

    if (isNetworkError) {
      showToast('Sin conexión al servidor. Verifique su conexión e inténtelo nuevamente.', 'error');
    } else if (isValidationError) {
      showToast('Datos inválidos. Verifique que el email no esté en uso y que los datos sean correctos.', 'error');
    } else {
      const action = client ? 'actualizar' : 'crear';
      const errorMsg = serviceError instanceof Error ? serviceError.message : 'Error desconocido';
      showToast(`Error al ${action} el cliente: ${errorMsg}`, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cliente: Cliente = {
        idCliente: client ? client.idCliente : undefined,
        nombre: formData.nombre,
        telefono: formData.telefono,
        direccion: formData.direccion,
        email: formData.email,
        notas: formData.notas
      };

      if (!formData.nombre.trim()) {
        showToast('El nombre del cliente es requerido', 'warning');
        setLoading(false);
        return;
      }

      await clienteService.guardar(cliente);

      showToast(client ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente', 'success');
      setTimeout(() => {
        onClientAdded();
        onClose();
      }, 1500);

      setFormData({
        nombre: '',
        telefono: '',
        direccion: '',
        email: '',
        notas: ''
      });
    } catch (serviceError) {
      handleApiError(serviceError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay">
      <div className="app-modal" role="dialog" aria-modal="true" aria-labelledby="client-modal-title">
        <div className="app-modal-header">
          <h2 id="client-modal-title" className="app-modal-title">
            {client ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="app-modal-form">
          <div className="app-modal-body">
            <div>
              <label className="field-label" htmlFor="cliente-nombre">Nombre *</label>
              <input
                id="cliente-nombre"
                type="text"
                required
                maxLength={150}
                className="field-input"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="field-row">
              <div>
                <label className="field-label" htmlFor="cliente-telefono">Teléfono *</label>
                <input
                  id="cliente-telefono"
                  type="tel"
                  required
                  maxLength={20}
                  autoComplete="tel"
                  className="field-input"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="cliente-email">Email</label>
                <input
                  id="cliente-email"
                  type="email"
                  maxLength={100}
                  autoComplete="email"
                  className="field-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="cliente-direccion">Dirección</label>
              <input
                id="cliente-direccion"
                type="text"
                maxLength={300}
                className="field-input"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="cliente-notas">Notas</label>
              <textarea
                id="cliente-notas"
                maxLength={500}
                className="field-input"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>
          </div>

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

export default ClientModal;
