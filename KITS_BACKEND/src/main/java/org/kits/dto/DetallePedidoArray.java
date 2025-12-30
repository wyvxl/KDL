package org.kits.dto;

import lombok.Data;

/**
 * DTO optimizado para operaciones con Arrays.
 * Representa un detalle de pedido en formato simplificado para
 * inserción/actualización eficiente usando FORALL en PL/SQL.
 */
@Data
public class DetallePedidoArray {
    /** ID del producto */
    private Integer idProducto;
    
    /** Cantidad solicitada */
    private Integer cantidad;
    
    /** Precio unitario del producto */
    private Double precio;

    /** Constructor por defecto */
    public DetallePedidoArray() {}

    /**
     * Constructor con parámetros para inicialización rápida.
     * 
     * @param idProducto ID del producto
     * @param cantidad Cantidad del producto
     * @param precio Precio unitario
     */
    public DetallePedidoArray(Integer idProducto, Integer cantidad, Double precio) {
        this.idProducto = idProducto;
        this.cantidad = cantidad;
        this.precio = precio;
    }

    /**
     * Convierte el DTO a un array de objetos para Oracle.
     * Utilizado en procedimientos almacenados que reciben arrays.
     * 
     * @return Array de objetos [idProducto, cantidad, precio]
     */
    public Object[] toOracleArray() {
        return new Object[]{idProducto, cantidad, precio};
    }
}