import api from './api';
import type { Usuario, CambiarContrasenaRequest } from '../pages/users';

/**
 * Servicio para gestión de Usuarios del sistema.
 * Permite CRUD completo, cambio de contraseña y activación/desactivación.
 */
const usuarioService = {
    /**
     * Lista todos los usuarios registrados.
     * @returns Promesa con array de Usuarios
     */
    listar: async (): Promise<Usuario[]> => {
        return await api.get<Usuario[]>('/usuario') as unknown as Usuario[];
    },

    /**
     * Crea o actualiza un usuario.
     * @param usuario Datos del usuario
     * @returns Promesa con el ID del usuario creado/actualizado
     */
    guardar: async (usuario: Usuario): Promise<number> => {
        return await api.post<number>('/usuario', usuario) as unknown as number;
    },

    /**
     * Cambia la contraseña de un usuario específico.
     * @param request Datos necesarios (usuario y nueva contraseña)
     */
    cambiarContrasena: async (request: CambiarContrasenaRequest): Promise<void> => {
        await api.put('/usuario/cambiar-contrasena', request);
    },

    /**
     * Elimina (o marca como inactivo según lógica de backend) un usuario.
     * @param id ID del usuario a eliminar
     * @returns Promesa con resultado de operación
     */
    eliminar: async (id: number): Promise<number> => {
        return await api.delete<number>(`/usuario/${id}`) as unknown as number;
    },

    /**
     * Reactiva un usuario previamente desactivado/eliminado lógica.
     * @param id ID del usuario a activar
     * @returns Promesa con resultado de operación
     */
    activar: async (id: number): Promise<number> => {
        return await api.put<number>(`/usuario/${id}/activar`) as unknown as number;
    }
};

export { usuarioService };
