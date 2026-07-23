package org.kits.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    /** Cantidad a ajustar (positiva o negativa) */
    @NotNull(message = "La cantidad es requerida")
    private Integer cantidad;

    /** Tipo de movimiento: ENTRADA o SALIDA */
    @NotBlank(message = "El tipo de movimiento es requerido")
    private String movimiento;
}