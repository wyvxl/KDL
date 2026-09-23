import { expect, test } from '@playwright/test';
import { iniciarSesion, pedido, simularBackend } from './mockApi';

test('un pedido registrado de madrugada muestra su fecha real', async ({ page }) => {
  // 04:00 en Costa Rica = 10:00 UTC. El formateo anterior lo mostraba como el día 19.
  await simularBackend(page, 'ADMIN', {
    pedidos: [{ ...pedido(1, '2026-09-23'), fechaPedido: '2026-09-20T10:00:00.000Z' }],
  });
  await iniciarSesion(page, 'ADMIN');

  await page.goto('/pedidos');

  const tarjeta = page.locator('.order-card').first();
  await expect(tarjeta).toContainText('20/09/2026');
  await expect(tarjeta).not.toContainText('19/09/2026');
});

test('los montos usan separador de miles en colones', async ({ page }) => {
  await simularBackend(page, 'ADMIN', { pedidos: [{ ...pedido(1, '2026-09-23'), total: 50000 }] });
  await iniciarSesion(page, 'ADMIN');

  await page.goto('/pedidos');

  // Intl usa un espacio fino (U+202F o U+00A0) como separador de miles en es-CR.
  await expect(page.locator('.order-card').first()).toContainText(/₡50\s000/);
});

test('editar el pedido de un cliente dado de baja conserva al cliente', async ({ page }) => {
  await simularBackend(page, 'ADMIN', {
    pedidos: [{ ...pedido(7, '2026-09-30'), cliente: { idCliente: 99, nombre: 'Cliente Antiguo' } }],
    clientes: [{ idCliente: 1, nombre: 'Cliente Activo', activo: 'S' }],
  });
  await iniciarSesion(page, 'ADMIN');

  await page.goto('/pedidos');
  await page.getByRole('button', { name: /^editar$/i }).first().click();

  await expect(page.getByLabel('Cliente *')).toHaveValue('99');
  await expect(page.getByLabel('Cliente *').locator('option:checked')).toHaveText('Cliente Antiguo (dado de baja)');
});

test('los botones de guardar de los modales quedan a la vista', async ({ page }) => {
  await simularBackend(page, 'ADMIN');
  await iniciarSesion(page, 'ADMIN');

  await page.goto('/productos');
  await page.getByRole('button', { name: /nuevo producto/i }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Guardar' })).toBeInViewport();

  await page.goto('/pedidos');
  await page.getByRole('button', { name: /nuevo pedido/i }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Crear Pedido' })).toBeInViewport();
});

test('los botones de activar/desactivar usuario conservan su color', async ({ page }) => {
  // Los modales reimportaban index.css; al cargar su CSS después del de la página,
  // .btn-secondary volvía a ganar y estos botones quedaban blancos.
  await page.route('http://localhost:8080/**', (route) => route.fulfill({
    json: new URL(route.request().url()).pathname === '/usuario'
      ? [{ idUsuario: 1, nombreUsuario: 'u1', nombreCompleto: 'U 1', email: 'u1@k.test', idRol: 1, nombreRol: 'VENDEDOR', rol: { idRol: 1, nombreRol: 'VENDEDOR' }, activo: 'S' },
        { idUsuario: 2, nombreUsuario: 'u2', nombreCompleto: 'U 2', email: 'u2@k.test', idRol: 1, nombreRol: 'VENDEDOR', rol: { idRol: 1, nombreRol: 'VENDEDOR' }, activo: 'N' }]
      : [],
  }));
  await iniciarSesion(page, 'ADMIN');

  await page.goto('/usuarios');

  await expect(page.locator('.btn-deactivate')).toHaveCSS('background-color', 'rgb(239, 68, 68)');
  await expect(page.locator('.btn-activate')).toHaveCSS('background-color', 'rgb(16, 185, 129)');
});

test('ninguna pantalla se desborda a lo ancho', async ({ page }) => {
  await simularBackend(page, 'ADMIN', { pedidos: [pedido(1, '2026-09-23')] });
  await iniciarSesion(page, 'ADMIN');

  for (const ruta of ['/', '/pedidos', '/productos', '/clientes', '/usuarios']) {
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    const desborde = await page.evaluate(() => {
      const main = document.querySelector('main');
      const nav = document.querySelector('.navbar-container');
      return {
        main: main ? main.scrollWidth - main.clientWidth : 0,
        nav: nav ? nav.scrollWidth - nav.clientWidth : 0,
      };
    });
    expect(desborde, ruta).toEqual({ main: 0, nav: 0 });
  }
});
