package org.kits.entities;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
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
    @NotBlank(message = "El nombre del producto es requerido")
    @Size(max = 100, message = "El nombre admite hasta 100 caracteres")
    private String nombre;
    /**
     * Descripción detallada del producto.
     */
    @Size(max = 300, message = "La descripción admite hasta 300 caracteres")
    private String descripcion;
    /**
     * Precio de venta unitario del producto.
     */
    @NotNull(message = "El precio es requerido")
    @PositiveOrZero(message = "El precio no puede ser negativo")
    private Double precio;
    /**
     * Cantidad actual de este producto en el inventario.
     */
    @PositiveOrZero(message = "El stock no puede ser negativo")
    private Integer stockActual;
    /**
     * Nivel mínimo de stock antes de generar una alerta.
     */
    @PositiveOrZero(message = "El stock mínimo no puede ser negativo")
    private Integer stockMinimo;
    /**
     * Unidad de medida del producto (ej. "Unidad", "Kg", "Litro").
     */
    @Size(max = 20, message = "La unidad de medida admite hasta 20 caracteres")
    private String unidadMedida;
    /**
     * Estado del producto ('S' activo, 'N' inactivo; PRODUCTOS.activo).
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
