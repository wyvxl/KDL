package org.kits.dto;

/**
 * Línea del parte de producción de cocina para una fecha.
 *
 * <p>Responde a la pregunta "¿qué tengo que hornear para el jueves?".</p>
 *
 * <ul>
 *   <li>{@code porPreparar}: unidades de pedidos del día todavía en PENDIENTE, es decir
 *       que aún no salieron del inventario.</li>
 *   <li>{@code yaAlistado}: unidades de pedidos del día ya tomados por cocina
 *       (EN_PROCESO o LISTO); su stock ya está descontado.</li>
 *   <li>{@code faltante}: cuánto falta hornear para poder cubrir {@code porPreparar} con
 *       el {@code stockActual} de este momento.</li>
 * </ul>
 */
public record ProduccionRequerida(
        Integer idProducto,
        String nombre,
        String unidadMedida,
        Integer stockActual,
        Integer porPreparar,
        Integer yaAlistado,
        Integer faltante) {
}
