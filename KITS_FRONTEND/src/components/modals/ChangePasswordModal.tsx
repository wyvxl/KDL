import React, { useState } from 'react';
import { usuarioService } from '../../services/usuarioService';
import type { CambiarContrasenaRequest } from '../../pages/users';

interface ChangePasswordModalProps {
  isOpen: boolean;        // Controla la visibilidad del modal
  onClose: () => void;    // Acción al cerrar
  onSuccess: () => void;  // Callback tras cambio exitoso
  nombreUsuario: string;  // Usuario al que se le cambiará la contraseña
}

/**
 * Modal para cambio de contraseña de usuario.
 * Permite ingresar nueva contraseña y su confirmación.
 */
const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  nombreUsuario
}) => {
  // Estado local para los campos del formulario
  const [formData, setFormData] = useState({
    nuevaContrasena: '',
    confirmarContrasena: ''
  });

  const [loading, setLoading] = useState(false); // Indicador de carga
  const [error, setError] = useState('');        // Mensajes de error

  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación básica: coincidencia de contraseñas
    if (formData.nuevaContrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validación: longitud mínima
    if (formData.nuevaContrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const request: CambiarContrasenaRequest = {
        nombreUsuario,
        nuevaContrasena: formData.nuevaContrasena
      };

      // Llamada al servicio
      await usuarioService.cambiarContrasena(request);

      onSuccess(); // Notificar éxito al componente padre
      onClose();   // Cerrar modal
      setFormData({ nuevaContrasena: '', confirmarContrasena: '' }); // Resetear form
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError('Error al cambiar la contraseña. Verifique que el servicio esté activo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejador genérico para inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Reset del formulario al cerrar
  const handleClose = () => {
    setFormData({ nuevaContrasena: '', confirmarContrasena: '' });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '2rem',
        width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Encabezado Modal */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text)' }}>
            Cambiar Contraseña
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer',
              color: 'var(--color-text-light)', padding: 0, width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Campo Usuario (Solo lectura) */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)'
            }}>
              Usuario:
            </label>
            <input
              type="text"
              value={nombreUsuario}
              disabled
              style={{
                width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)',
                borderRadius: '8px', fontSize: '1rem', backgroundColor: '#f3f4f6', color: '#6b7280'
              }}
            />
          </div>

          {/* Nueva Contraseña */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)'
            }}>
              Nueva Contraseña:
            </label>
            <input
              type="password"
              name="nuevaContrasena"
              value={formData.nuevaContrasena}
              onChange={handleChange}
              required
              minLength={6}
              style={{
                width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)',
                borderRadius: '8px', fontSize: '1rem'
              }}
            />
          </div>

          {/* Confirmar Contraseña */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)'
            }}>
              Confirmar Contraseña:
            </label>
            <input
              type="password"
              name="confirmarContrasena"
              value={formData.confirmarContrasena}
              onChange={handleChange}
              required
              minLength={6}
              style={{
                width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)',
                borderRadius: '8px', fontSize: '1rem'
              }}
            />
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div style={{
              padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2',
              color: '#dc2626', borderRadius: '8px', fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {/* Botones de Acción */}
          <div style={{
            display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
