import { useState, type ChangeEvent, type FormEvent } from 'react';
import { type Rol, rolService } from '../services/rolService';

interface FormData {
  nombreRol: string;
  descripcion: string;
}

export const useRolForm = (onSuccess: (nuevoRol: Rol) => void, onClose: () => void) => {
  const [formData, setFormData] = useState<FormData>({
    nombreRol: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const resetForm = () => {
    setFormData({ nombreRol: '', descripcion: '' });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    if (!formData.nombreRol.trim()) {
      setError('El nombre del rol es requerido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      const nuevoRol = await rolService.crear(formData);
      onSuccess(nuevoRol);
      handleClose();
    } catch (err) {
      console.error('Error al crear rol:', err);
      setError('Error al crear el rol. Verifique conexión.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    error,
    handleChange,
    handleClose,
    handleSubmit
  };
};
