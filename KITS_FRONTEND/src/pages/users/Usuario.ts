/** Interfaz que define la estructura de un Usuario (para gestión CRUD) */
export interface Usuario {
    idUsuario: number;
    nombreUsuario?: string;
    nombreCompleto?: string;
    email?: string;
    idRol?: number;
    contrasena?: string; // Opcional (solo requerida al crear o cambiar password)
    activo?: string; // Estado del usuario ('S' = Activo, 'N' = Inactivo)
}

/** Interfaz para la petición de cambio de contraseña */
export interface CambiarContrasenaRequest {
    nombreUsuario: string;
    nuevaContrasena: string;
}
