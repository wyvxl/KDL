/**
 * Día de calendario local ('YYYY-MM-DD') de una fecha.
 *
 * No usar `toISOString()` para esto: convierte a UTC, así que el día puede correrse según
 * la hora y la zona horaria del navegador.
 */
export const diaLocal = (fecha: Date): string => {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
};

/**
 * Normaliza a 'YYYY-MM-DD' (día local) lo que manda el backend: un día de calendario ya
 * formateado (fechaProgramada), un instante ISO (fechaEntrega) o un Date.
 *
 * @returns la fecha normalizada, o '' si no hay fecha o no se puede interpretar.
 */
export const aDiaLocal = (fecha: Date | string | null | undefined): string => {
  if (!fecha) return '';
  // Un día de calendario suelto se deja tal cual: `new Date('2026-07-29')` lo leería
  // como medianoche UTC y en UTC-6 caería en el día anterior.
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return isNaN(d.getTime()) ? '' : diaLocal(d);
};
