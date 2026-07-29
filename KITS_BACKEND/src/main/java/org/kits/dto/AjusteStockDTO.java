package org.kits.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * DTO para realizar ajustes de stock en productos.
 * Utilizado en el endpoint de ajuste de inventario.
 */
@Data
public class AjusteStockDTO {
    /** ID del producto a ajustar */
    @NotNull(message = "El id del producto es requerido")
    private Integer idProducto;

    /** Cantidad a mover. El sentido lo da {@link #movimiento}, así que siempre es positiva. */
    @NotNull(message = "La cantidad es requerida")
    @Positive(message = "La cantidad debe ser mayor que cero")
    private Integer cantidad;

    /** Tipo de movimiento: ENTRADA (producción) o SALIDA (merma) */
    @NotBlank(message = "El tipo de movimiento es requerido")
    @Pattern(regexp = "ENTRADA|SALIDA", message = "El movimiento debe ser ENTRADA o SALIDA")
    private String movimiento;
}