package org.kits.dto;

/**
 * Producto del catálogo con su disponibilidad para una fecha concreta.
 *
 * <p>Es lo que necesita ver el vendedor al tomar un pedido para saber cuánto puede
 * prometer:</p>
 *
 * <pre>disponible = stockActual - comprometido</pre>
 *
 * <p>{@code comprometido} son las cantidades de los pedidos aún PENDIENTES con fecha
 * programada igual o anterior a la consultada. Los pedidos que cocina ya tomó no cuentan
 * aquí porque su stock ya salió de {@code stockActual}.</p>
 *
 * <p>Para fechas futuras {@code disponible} es orientativo, no un tope: lo que falte se
 * hornea ese día. Solo es vinculante para pedidos del mismo día.</p>
 */
public record DisponibilidadProducto(
        Integer idProducto,
        String nombre,
        String descripcion,
        Double precio,
        Integer stockActual,
        Integer stockMinimo,
        String unidadMedida,
        String activo,
        Integer comprometido,
        Integer disponible) {
}
