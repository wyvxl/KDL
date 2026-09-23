import type { Page } from '@playwright/test';

const API = 'http://localhost:8080';

type Rol = 'ADMIN' | 'VENDEDOR' | 'PANADERO' | 'REPARTIDOR';

/** Mismos permisos que emite LUsuario.obtenerPermisosPorRol en el backend. */
const PERMISOS: Record<Rol, string[]> = {
  ADMIN: ['VER_DASHBOARD', 'VER_PEDIDOS', 'VER_CLIENTES', 'VER_PRODUCTOS', 'VER_USUARIOS', 'VER_PRODUCCION',
    'GESTIONAR_PEDIDOS', 'AVANZAR_PEDIDOS', 'GESTIONAR_PRODUCTOS', 'GESTIONAR_TODO'],
  VENDEDOR: ['VER_DASHBOARD', 'VER_PEDIDOS', 'VER_CLIENTES', 'VER_PRODUCTOS', 'GESTIONAR_PEDIDOS'],
  PANADERO: ['VER_DASHBOARD', 'VER_PEDIDOS', 'VER_PRODUCTOS', 'VER_PRODUCCION', 'AVANZAR_PEDIDOS', 'GESTIONAR_PRODUCTOS'],
  REPARTIDOR: ['VER_DASHBOARD', 'VER_PEDIDOS', 'AVANZAR_PEDIDOS'],
};

export const usuarioCon = (rol: Rol) => ({
  idUsuario: 1,
  nombreUsuario: rol.toLowerCase(),
  nombreCompleto: `Usuario ${rol}`,
  email: `${rol.toLowerCase()}@kits.test`,
  idRol: 1,
  nombreRol: rol,
  permisos: PERMISOS[rol],
});

export const pedido = (id: number, fechaProgramada: string, estado = 'PENDIENTE') => ({
  idPedido: id,
  cliente: { idCliente: 1, nombre: `Cliente ${id}` },
  usuarioResponsable: { idUsuario: 1, nombreCompleto: 'Usuario VENDEDOR' },
  fechaPedido: '2026-09-20T15:00:00.000Z',
  fechaProgramada,
  fechaEntrega: null,
  estado,
  pagado: false,
  total: 1500,
});

interface Datos {
  pedidos?: unknown[];
  productos?: unknown[];
}

/**
 * Simula el backend: login para el rol indicado y listados con los datos dados.
 * Cualquier otro GET responde una lista vacía.
 */
export async function simularBackend(page: Page, rol: Rol, datos: Datos = {}) {
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const json = (body: unknown) => route.fulfill({ json: body });

    if (url.pathname === '/usuario/autenticar') {
      return json({ token: 'token-de-prueba', usuario: usuarioCon(rol) });
    }
    if (request.method() !== 'GET') {
      return json(1);
    }
    if (url.pathname === '/pedido') return json(datos.pedidos ?? []);
    if (url.pathname === '/producto') return json(datos.productos ?? []);
    return json([]);
  });
}

/** Deja la sesión iniciada sin pasar por el formulario. */
export async function iniciarSesion(page: Page, rol: Rol) {
  await page.addInitScript((usuario) => {
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('user', JSON.stringify(usuario));
  }, usuarioCon(rol));
}
