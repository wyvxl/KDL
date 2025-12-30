package org.kits.dto;

import lombok.Data;

/**
 * DTO para realizar ajustes de stock en productos.
 * Utilizado en el endpoint de ajuste de inventario.
 */
@Data
public class AjusteStockDTO {
    /** ID del producto a ajustar */
    private Integer idProducto;
    
    /** Cantidad a ajustar (positiva o negativa) */
    private Integer cantidad;
    
    /** Tipo de movimiento: ENTRADA o SALIDA */
    private String movimiento;
}