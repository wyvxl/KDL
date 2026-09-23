import { aDiaLocal } from './fechas';

/*
 * Formato único para montos y fechas en toda la app. Antes cada pantalla lo hacía a su
 * manera: "₡50000.00" en Pedidos, "₡50,000" en el Dashboard, fechas en formato de EE. UU.
 * (9/22/2026) según el idioma del navegador.
 */

const colonesEnteros = new Intl.NumberFormat('es-CR', {
  style: 'currency', currency: 'CRC', maximumFractionDigits: 0,
});
const colonesConCentimos = new Intl.NumberFormat('es-CR', {
  style: 'currency', currency: 'CRC', minimumFractionDigits: 2, maximumFractionDigits: 2,
});

/** Monto en colones: "₡50 000", o "₡1 500,50" si tiene céntimos. */
export const formatoMoneda = (valor: number | null | undefined): string => {
  const monto = Number(valor ?? 0);
  return Number.isInteger(monto) ? colonesEnteros.format(monto) : colonesConCentimos.format(monto);
};

/**
 * Fecha como 'dd/mm/aaaa' (o 'dd/mm' sin año), en día local.
 *
 * Sirve tanto para un día de calendario ('2026-09-23') como para un instante ISO o un
 * Date. Reemplaza el truco de `replace(/-/g, '/')`, que con un Date convertía la zona
 * "GMT-0600" en algo que el navegador leía como UTC: un pedido registrado antes de las
 * 6 a. m. aparecía con fecha del día anterior.
 */
export const formatoFecha = (
  fecha: Date | string | number | null | undefined,
  { conAnio = true }: { conAnio?: boolean } = {},
): string => {
  const dia = aDiaLocal(typeof fecha === 'number' ? new Date(fecha) : fecha);
  if (!dia) return 'N/A';
  const [anio, mes, diaMes] = dia.split('-');
  return conAnio ? `${diaMes}/${mes}/${anio}` : `${diaMes}/${mes}`;
};
