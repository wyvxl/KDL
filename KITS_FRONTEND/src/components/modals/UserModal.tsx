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
    idUsuario: null, // null = usuario nuevo; el backend hace INSERT
    nombreUsuario: '',
    nombreCompleto: '',
    email: '',
    idRol: undefined, // sin rol hasta que se sepa cuáles existen de verdad
    contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<Rol[]>([]);

  /**
   * Rol por defecto para un usuario nuevo: el primero de la lista real.
   *
   * Nunca se inventa un id. Los ids de ROLES son GENERATED ALWAYS AS IDENTITY y se
   * desplazan al recargar los datos de prueba, así que un `1` fijo puede apuntar a un
   * rol que no existe y hacer fallar el INSERT por clave foránea.
   */
  const rolPorDefecto = (listaRoles: Rol[]): number | undefined => listaRoles[0]?.idRol;

  // Carga de roles una sola vez al montar. Ya no depende de `usuario` ni de `formData`:
  // quién es el rol por defecto lo decide el efecto de sincronización de abajo.
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const fetchedRoles = await rolService.listar();
        if (Array.isArray(fetchedRoles) && fetchedRoles.length > 0) {
          setRoles(fetchedRoles);
          setError('');
        } else {
          // Sin roles no se puede crear un usuario: id_rol es NOT NULL con FK a ROLES.
          // Antes se fabricaba un rol falso con id 1, que solo servía para que el
          // guardado fallara después con un error mucho menos claro.
          setRoles([]);
          setError('No hay roles disponibles. No se puede crear ni editar usuarios.');
        }
      } catch (err) {
        console.error('Error al cargar roles:', err);
        const isNetworkError = err instanceof Error && (err.message.includes('Network') || err.message.includes('fetch'));
        setRoles([]);
        setError(isNetworkError
          ? 'Sin conexión al servidor. No se pudieron cargar los roles.'
          : 'No se pudieron cargar los roles. Inténtelo nuevamente.');
      }
    };
    void fetchRoles();
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- sincronización intencional del formulario con el usuario */
  useEffect(() => {
    if (usuario) {
      setFormData({ ...usuario, contrasena: '' });
    } else {
      setFormData((prev: Usuario) => ({
        ...prev,
        idUsuario: null,
        nombreUsuario: '',
        nombreCompleto: '',
        email: '',
        idRol: rolPorDefecto(roles),
        contrasena: ''
      }));
    }
  }, [usuario, roles]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Usuario) => ({
      ...prev,
      // La opción vacía del select debe dejar idRol sin valor, no en 0.
      [name]: name === 'idRol' ? (value === '' ? undefined : Number(value)) : value
    }));
    setError('');
  };

  const resetForm = () => {
    setFormData({
      idUsuario: null,
      nombreUsuario: '',
      nombreCompleto: '',
      email: '',
      idRol: rolPorDefecto(roles),
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
    if (!formData.idRol) {
      setError('Debe seleccionar un rol');
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
      const idGuardado = await usuarioService.guardar(formData);

      // El backend devuelve el id del usuario creado o actualizado. Si viene 0 es que
      // no se guardó nada; sin esta comprobación el modal se cerraba como si todo
      // hubiera ido bien y el usuario simplemente no aparecía en la lista.
      if (!idGuardado || idGuardado <= 0) {
        setError('El usuario no se pudo guardar. Verifique los datos e inténtelo nuevamente.');
        return;
      }

      onSave({ ...formData, idUsuario: idGuardado });
      handleClose();
    } catch (serviceError) {
      handleApiError(serviceError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay">
      <div className="app-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <div className="app-modal-header">
          <h2 id="user-modal-title" className="app-modal-title">
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="app-modal-form">
          <div className="app-modal-body">
            <div>
              <label className="field-label" htmlFor="usuario-nombre-usuario">Nombre de Usuario *</label>
              <input
                id="usuario-nombre-usuario"
                type="text" name="nombreUsuario"
                className="field-input"
                autoComplete="off"
                value={formData.nombreUsuario ?? ''}
                onChange={handleChange}
                disabled={!!usuario}
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="usuario-nombre-completo">Nombre Completo *</label>
              <input
                id="usuario-nombre-completo"
                type="text" name="nombreCompleto"
                className="field-input"
                value={formData.nombreCompleto ?? ''}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="usuario-email">Email *</label>
              <input
                id="usuario-email"
                type="email" name="email"
                className="field-input"
                value={formData.email ?? ''}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="usuario-rol">Rol *</label>
              <select
                id="usuario-rol"
                name="idRol"
                className="field-input"
                value={formData.idRol ?? ''}
                onChange={handleChange}
                required
                disabled={roles.length === 0}
              >
                <option value="">Seleccionar rol</option>
                {roles.map(rol => (
                  <option key={rol.idRol} value={rol.idRol}>
                    {rol.nombreRol}
                  </option>
                ))}
              </select>
            </div>

            {!usuario && (
              <div>
                <label className="field-label" htmlFor="usuario-contrasena">Contraseña *</label>
                <input
                  id="usuario-contrasena"
                  type="password" name="contrasena"
                  className="field-input"
                  autoComplete="new-password"
                  value={formData.contrasena ?? ''}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
              </div>
            )}

            {error && (
              <div className="error-message" role="alert" style={{ color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}
          </div>

          <div className="app-modal-footer">
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={loading}>
              Cancelar
            </button>
            {/* Sin roles cargados no se puede guardar: id_rol es NOT NULL con FK a ROLES */}
            <button type="submit" className="btn btn-primary" disabled={loading || roles.length === 0}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
