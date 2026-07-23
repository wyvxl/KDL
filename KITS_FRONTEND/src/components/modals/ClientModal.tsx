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
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '12px',
        width: '90%', maxWidth: '500px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>
          {client ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)',
                minHeight: '80px', resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
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

export default ClientModal;
