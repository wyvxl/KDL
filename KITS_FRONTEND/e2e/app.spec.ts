import { expect, test } from '@playwright/test';
import { iniciarSesion, pedido, simularBackend } from './mockApi';

const kpi = (page: import('@playwright/test').Page, titulo: string) =>
  page.locator('.kpi-card', { hasText: titulo }).locator('.kpi-value');

test('el login guarda la sesión y lleva al dashboard', async ({ page }) => {
  await simularBackend(page, 'VENDEDOR');
  await page.goto('/login');

  await page.getByLabel('Usuario').fill('vendedor');
  await page.getByLabel('Contraseña').fill('secreta');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Agenda del Día' })).toBeVisible();
});

test('sin sesión cualquier ruta lleva al login', async ({ page }) => {
  await page.goto('/pedidos');
  await expect(page).toHaveURL('/login');
});

test('una pantalla sin permiso redirige al inicio en vez de mostrar un 403', async ({ page }) => {
  await simularBackend(page, 'VENDEDOR');
  await iniciarSesion(page, 'VENDEDOR');

  await page.goto('/usuarios');
  await expect(page).toHaveURL('/');

  // El vendedor sí puede entrar a clientes.
  await page.goto('/clientes');
  await expect(page).toHaveURL('/clientes');
});

test('de noche en Costa Rica, los pedidos de hoy siguen siendo de hoy', async ({ page }) => {
  // 19:30 en UTC-6 = 01:30 UTC del día siguiente: cualquier cálculo de "hoy" que pase por
  // UTC tomaría el 24 como hoy.
  await page.clock.setFixedTime(new Date('2026-09-24T01:30:00Z'));
  await simularBackend(page, 'ADMIN', {
    pedidos: [
      pedido(1, '2026-09-23'),
      pedido(2, '2026-09-23', 'EN_PROCESO'),
      pedido(3, '2026-09-24'),
      pedido(4, '2026-09-22'),
    ],
  });
  await iniciarSesion(page, 'ADMIN');

  await page.goto('/');

  await expect(kpi(page, 'Pedidos de Hoy')).toHaveText('2');
  await expect(kpi(page, 'Pedidos Atrasados')).toHaveText('1');
});
