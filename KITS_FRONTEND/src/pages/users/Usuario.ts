/** Interfaz que define la estructura de un Usuario (para gestión CRUD) */
export interface Usuario {
    /**
     * ID del usuario. Debe ser `null` al crear uno nuevo: el backend decide entre
     * INSERT y UPDATE según si llega nulo (sp_gestionar_usuario). Enviar 0 lo mandaba
     * al UPDATE, que no encontraba ninguna fila y no creaba nada.
     */
    idUsuario: number | null;
    nombreUsuario?: string;
    nombreCompleto?: string;
    email?: string;
    idRol?: number;
    contrasena?: string; // Opcional (solo requerida al crear o cambiar password)
    activo?: string; // Estado del usuario ('S' = Activo, 'N' = Inactivo)
    /**
     * Fecha y hora del último inicio de sesión, en ISO 8601 UTC.
     * Ausente si el usuario nunca ha entrado.
     */
    ultimoAcceso?: string;
}

/** Petición de restablecimiento de contraseña de otro usuario (solo administradores) */
export interface CambiarContrasenaRequest {
    nombreUsuario: string;
    nuevaContrasena: string;
}

/**
 * Petición para cambiar la contraseña propia.
 * No lleva usuario: el backend lo toma del token, así nadie puede cambiar la de otro.
 */
export interface CambiarMiContrasenaRequest {
    contrasenaActual: string;
    nuevaContrasena: string;
}
