import { authService } from '../services/authService';

/**
 * Códigos de permiso que emite el backend en el login (LUsuario.obtenerPermisosPorRol).
 *
 * Sirven para mostrar u ocultar controles. La autorización real la aplica el backend
 * en SecurityConfig: ocultar un botón aquí no protege nada por sí solo.
 */
export const PERMISOS = {
  /** Ve el tablero. Lo tiene todo usuario autenticado. */
  VER_DASHBOARD: 'VER_DASHBOARD',
  VER_PEDIDOS: 'VER_PEDIDOS',
  VER_CLIENTES: 'VER_CLIENTES',
  VER_PRODUCTOS: 'VER_PRODUCTOS',
  VER_USUARIOS: 'VER_USUARIOS',
  /** Ve el parte de producción de cocina. */
  VER_PRODUCCION: 'VER_PRODUCCION',
  /** Crea, edita, cobra y elimina pedidos (vendedor). */
  GESTIONAR_PEDIDOS: 'GESTIONAR_PEDIDOS',
  /** Avanza el estado del pedido: procesar, listo, entregar (cocina y reparto). */
  AVANZAR_PEDIDOS: 'AVANZAR_PEDIDOS',
  /** Crea productos y mueve inventario (cocina). */
  GESTIONAR_PRODUCTOS: 'GESTIONAR_PRODUCTOS',
} as const;

/** Comodín del rol ADMIN: concede cualquier permiso. */
const COMODIN_ADMIN = 'GESTIONAR_TODO';

/**
 * Indica si el usuario de la sesión actual tiene un permiso.
 *
 * @param permiso Código de permiso (ver {@link PERMISOS})
 */
export const tienePermiso = (permiso: string): boolean => {
  const permisos = authService.getCurrentUser()?.permisos ?? [];
  return permisos.includes(permiso) || permisos.includes(COMODIN_ADMIN);
};
