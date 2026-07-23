import React, { useState, useEffect } from 'react';
import { usuarioService } from '../../services/usuarioService';
import type { Usuario } from '../../pages/users';
import { type Rol, rolService } from '../../services/rolService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (usuario: Usuario) => void;
  usuario?: Usuario | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, usuario }) => {
  const [formData, setFormData] = useState<Usuario>({
    idUsuario: 0,
    nombreUsuario: '',
    nombreCompleto: '',
    email: '',
    idRol: 1,
    contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<Rol[]>([]);

  /* eslint-disable react-hooks/exhaustive-deps -- carga de roles una sola vez al montar */
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const fetchedRoles = await rolService.listar();
        if (Array.isArray(fetchedRoles) && fetchedRoles.length > 0) {
          setRoles(fetchedRoles);
          if (!usuario && !formData.idRol) {
            setFormData((prev: Usuario) => ({ ...prev, idRol: fetchedRoles[0].idRol ?? 1 }));
          }
          setError('');
        } else {
          console.warn('No se encontraron roles, usando rol por defecto');
          const defaultRoles = [{ idRol: 1, nombreRol: 'Usuario', descripcion: 'Rol por defecto' }];
          setRoles(defaultRoles);
          if (!usuario) {
            setFormData((prev: Usuario) => ({ ...prev, idRol: 1 }));
          }
        }
      } catch (err) {
        console.error('Error al cargar roles:', err);
        const isNetworkError = err instanceof Error && (err.message.includes('Network') || err.message.includes('fetch'));
        if (isNetworkError) {
          setError('Sin conexión al servidor. Usando roles por defecto.');
        } else {
          setError('Error al cargar roles. Usando configuración por defecto.');
        }
        const fallbackRoles = [{ idRol: 1, nombreRol: 'Usuario', descripcion: 'Rol por defecto' }];
        setRoles(fallbackRoles);
        if (!usuario) {
          setFormData((prev: Usuario) => ({ ...prev, idRol: 1 }));
        }
        setTimeout(() => setError(''), 5000);
      }
    };
    void fetchRoles();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/set-state-in-effect -- sincronización intencional del formulario con el usuario */
  useEffect(() => {
    if (usuario) {
      setFormData({ ...usuario, contrasena: '' });
    } else {
      setFormData((prev: Usuario) => ({
        ...prev,
        idUsuario: 0,
        nombreUsuario: '',
        nombreCompleto: '',
        email: '',
        idRol: roles.length > 0 ? roles[0].idRol ?? 1 : 1,
        contrasena: ''
      }));
    }
  }, [usuario, roles]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Usuario) => ({
      ...prev,
      [name]: name === 'idRol' ? Number(value) : value
    }));
    setError('');
  };

  const resetForm = () => {
    setFormData({
      idUsuario: 0,
      nombreUsuario: '',
      nombreCompleto: '',
      email: '',
      idRol: roles.length > 0 ? roles[0].idRol ?? 1 : 1,
      contrasena: ''
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleApiError = (serviceError: unknown) => {
    console.error('Error en servicio de usuarios:', serviceError);

    const isNetworkError = serviceError instanceof Error &&
      (serviceError.message.includes('Network') || serviceError.message.includes('fetch') || serviceError.message.includes('ECONNREFUSED'));

    const isValidationError = serviceError instanceof Error &&
      (serviceError.message.includes('validation') || serviceError.message.includes('duplicate') || serviceError.message.includes('constraint'));

    if (isNetworkError) {
      setError('Sin conexión al servidor. Verifique su conexión e inténtelo nuevamente.');
    } else if (isValidationError) {
      setError('Datos inválidos. Verifique que el nombre de usuario y email no estén en uso.');
    } else {
      const action = usuario ? 'actualizar' : 'crear';
      setError(`Error al ${action} el usuario. Inténtelo nuevamente.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nombreUsuario) {
      setError('El nombre de usuario es requerido');
      return;
    }
    if (!formData.nombreCompleto) {
      setError('El nombre completo es requerido');
      return;
    }
    if (!formData.email) {
      setError('El email es requerido');
      return;
    }
    if (!usuario && !formData.contrasena) {
      setError('La contraseña es requerida para nuevos usuarios');
      return;
    }
    if (!usuario && (formData.contrasena ?? '').length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await usuarioService.guardar(formData);
      onSave(formData);
      handleClose();
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
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)', flexShrink: 0 }}>
          {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>

            <div className="form-group">
              <label>Nombre de Usuario *</label>
              <input
                type="text" name="nombreUsuario"
                value={formData.nombreUsuario ?? ''}
                onChange={handleChange}
                disabled={!!usuario}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text" name="nombreCompleto"
                value={formData.nombreCompleto ?? ''}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email" name="email"
                value={formData.email ?? ''}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="form-group">
              <label>Rol *</label>
              <select
                name="idRol"
                value={formData.idRol ?? 1}
                onChange={handleChange}
                required
                disabled={false}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#F9FAFB',
                  color: 'var(--text-primary)'
                }}
              >
                {roles.map(rol => (
                  <option key={rol.idRol} value={rol.idRol}>
                    {rol.nombreRol}
                  </option>
                ))}
              </select>
            </div>

            {!usuario && (
              <div className="form-group">
                <label>Contraseña *</label>
                <input
                  type="password" name="contrasena"
                  value={formData.contrasena ?? ''}
                  onChange={handleChange}
                  minLength={6}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: 'var(--text-primary)' }}
                />
              </div>
            )}

            {error && (
              <div className="error-message" style={{ color: 'var(--color-danger)', marginTop: '0.5rem' }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', flexShrink: 0 }}>
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
