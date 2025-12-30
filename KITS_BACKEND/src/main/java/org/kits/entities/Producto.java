package org.kits.entities;

import lombok.Data;

/**
 * Representa un producto en el inventario.
 * Contiene información sobre el nombre, precio, stock y otros detalles.
 */
@Data
public class Producto {
    /**
     * Identificador único del producto.
     */
    private Integer idProducto;
    /**
     * Nombre del producto.
     */
    private String nombre;
    /**
     * Descripción detallada del producto.
     */
    private String descripcion;
    /**
     * Precio de venta unitario del producto.
     */
    private Double precio;
    /**
     * Cantidad actual de este producto en el inventario.
     */
    private Integer stockActual;
    /**
     * Nivel mínimo de stock antes de generar una alerta.
     */
    private Integer stockMinimo;
    /**
     * Unidad de medida del producto (ej. "Unidad", "Kg", "Litro").
     */
    private String unidadMedida;
    /**
     * Estado del producto ('A' para activo, 'I' para inactivo).
     */
    private String activo;

    /**
     * Constructor por defecto.
     */
    public Producto() {
        super();
    }

    /**
     * Constructor con campos esenciales para crear un producto.
     * @param idProducto ID del producto.
     * @param nombre Nombre del producto.
     * @param descripcion Descripción.
     * @param precio Precio unitario.
     * @param stockActual Stock inicial.
     */
    public Producto(Integer idProducto, String nombre, String descripcion, Double precio, Integer stockActual) {
        this();
        this.idProducto = idProducto;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stockActual = stockActual;
    }
}
