package org.kits.entities;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

/**
 * Representa una línea de detalle dentro de un pedido.
 * Asocia un producto con una cantidad y un precio específico para esa venta.
 */
@Data
public class DetallePedido {
    /**
     * Identificador del pedido al que pertenece este detalle.
     */
    private Integer idPedido;
    /**
     * El producto que se está incluyendo en el pedido.
     */
    private Producto producto;
    /**
     * La cantidad de unidades de este producto.
     */
    private Integer cantidad;
    /**
     * El precio unitario del producto en el momento de la venta.
     * Se utiliza @JsonAlias para aceptar "precio" en el JSON de entrada.
     */
    @JsonAlias("precio")
    private Double precioUnitario;

    /**
     * Constructor por defecto.
     */
    public DetallePedido() {
    }

    /**
     * Constructor con todos los campos.
     * 
     * @param idPedido       ID del pedido padre.
     * @param producto       El producto asociado.
     * @param cantidad       La cantidad vendida.
     * @param precioUnitario El precio por unidad.
     */
    public DetallePedido(Integer idPedido, Producto producto, Integer cantidad, Double precioUnitario) {
        this();
        this.idPedido = idPedido;
        this.producto = producto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }

    public Integer getIdProducto() {
        return producto != null ? producto.getIdProducto() : null;
    }

    public String getNombreProducto() {
        return producto != null ? producto.getNombre() : null;
    }
}
