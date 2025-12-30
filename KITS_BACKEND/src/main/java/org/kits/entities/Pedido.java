package org.kits.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

/**
 * Representa la cabecera de un pedido en el sistema.
 * Contiene información del cliente, fechas, estado y el total.
 */
@Data
public class Pedido {
    /**
     * Identificador único del pedido.
     */
    private Integer idPedido;
    /**
     * Cliente que realizó el pedido.
     */
    private Cliente cliente;
    /**
     * Usuario responsable de gestionar el pedido.
     */
    private Usuario usuarioResponsable;

    /**
     * Fecha y hora en que se creó el pedido.
     * Se formatea a ISO 8601 en UTC.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Date fechaPedido;

    /**
     * Fecha programada para la entrega del pedido.
     * Se formatea como "yyyy-MM-dd".
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date fechaProgramada;

    /**
     * Fecha y hora en que se completó la entrega del pedido.
     * Se formatea a ISO 8601 en UTC.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Date fechaEntrega;
    
    /**
     * Indica si el pedido ha sido pagado (true) o no (false).
     */
    private Boolean pagado;
    /**
     * Monto total del pedido, calculado a partir de sus detalles.
     */
    private Double total;
    /**
     * Lista de productos (detalles) que componen el pedido.
     */
    private List<DetallePedido> detalles;
    
    /**
     * Estado del pedido (PENDIENTE, EN_PROCESO, LISTO, ENTREGADO, CANCELADO).
     */
    private String estado;

    /**
     * Constructor por defecto. Inicializa la lista de detalles.
     */
    public Pedido() {
        this.detalles = new ArrayList<>();
    }

    /**
     * Constructor con campos esenciales para la creación de un pedido.
     * @param idPedido ID del pedido.
     * @param cliente Cliente asociado.
     * @param usuarioResponsable Usuario que gestiona el pedido.
     * @param fechaPedido Fecha de creación.
     * @param fechaProgramada Fecha de entrega programada.
     * @param estado Estado inicial del pedido.
     */
    public Pedido(Integer idPedido, Cliente cliente, Usuario usuarioResponsable, Date fechaPedido, Date fechaProgramada, String estado) {
        this();
        this.idPedido = idPedido;
        this.cliente = Objects.requireNonNull(cliente, "Cliente no puede ser null");
        this.usuarioResponsable = Objects.requireNonNull(usuarioResponsable, "Usuario responsable no puede ser null");
        this.fechaPedido = fechaPedido;
        this.fechaProgramada = Objects.requireNonNull(fechaProgramada, "Fecha programada no puede ser null");
        this.estado = Objects.requireNonNull(estado, "Estado no puede ser null");
    }


}
