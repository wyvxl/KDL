package org.kits.bl;

import org.kits.db.ConnectionManager;
import org.kits.db.Operations;
import org.kits.dto.DetallePedidoArray;
import org.kits.dto.Parameter;
import org.kits.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Se encarga de la comunicación con la base de datos y la transformación de datos.
 */
@Component
public class LPedido extends Operations {

    private static final Logger LOGGER = Logger.getLogger(LPedido.class.getName());

    @Autowired
    public LPedido(ConnectionManager connectionManager) {
        super(connectionManager);
    }

    /**
     * Convierte un objeto de fecha genérico de la base de datos a un objeto {@code java.util.Date}.
     *     <li>Tipos estándar de {@code java.sql} como {@link Timestamp} y {@link java.sql.Date}.</li>
     *     <li>Tipos modernos de {@code java.time} como {@link LocalDateTime} y {@link LocalDate}.</li>
     *     <li>Un fallback que procesa la representación en {@link String} del objeto, necesario para
     *     ciertos tipos de datos propietarios de bases de datos (como Oracle) que no se mapean directamente.</li>
     *
     * @param dbObject El objeto de fecha retornado por la base de datos.
     * @return Un objeto {@code java.util.Date} o {@code null} si la conversión falla o el input es nulo.
     */
    private Date toDate(Object dbObject) {
        if (dbObject == null) {
            return null;
       }

        switch (dbObject) {
            case Timestamp ts:
                return new Date(ts.getTime());
            case java.sql.Date sqlDate:
                return new Date(sqlDate.getTime());
            case LocalDateTime ldt:
                return Date.from(ldt.atZone(ZoneId.systemDefault()).toInstant());
            case LocalDate ld:
                return Date.from(ld.atStartOfDay(ZoneId.systemDefault()).toInstant());
            default:
                // Manejar objetos que no son tipos de fecha estándar
                // pero cuya representación en String sí es una fecha válida.
                String dateStr = dbObject.toString();
                try {
                    // Intenta convertir directamente a Timestamp, que maneja "YYYY-MM-DD HH:MI:SS.F"
                    return Timestamp.valueOf(dateStr);
                } catch (IllegalArgumentException e) {
                    // si falla se intenta un parseo manual como último recurso.
                    try {
                        if (dateStr.length() >= 19) { // Debe tener al menos hasta los segundos
                            return new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(dateStr.substring(0, 19));
                        }
                    } catch (Exception parseEx) {
                        LOGGER.warning("No se pudo convertir el objeto a fecha usando el fallback de String: " + dbObject + " (Tipo: " + dbObject.getClass().getName() + ")");
                    }
                }

                return null;
        }
    }


    /**
     * Lista todos los pedidos con información básica del cliente y usuario responsable.
     */
    public ArrayList<Pedido> Listar() {
        var pedidos = new ArrayList<Pedido>();
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_PEDIDOS.sp_op_listar_pedidos", parameters);
        if (result != null) {
            for (Map<String, Object> row : result) {
                try {
                    Cliente cliente = new Cliente();
                    cliente.setIdCliente(((BigDecimal) row.get("id_cliente")).intValue());
                    cliente.setNombre((String) row.get("nombre_cliente"));

                    Usuario usuario = new Usuario();
                    usuario.setIdUsuario(((BigDecimal) row.get("id_usuario_responsable")).intValue());
                    usuario.setNombreCompleto((String) row.get("nombre_usuario"));

                    Pedido p = new Pedido();
                    p.setIdPedido(((BigDecimal) row.get("id_pedido")).intValue());
                    p.setCliente(cliente);
                    p.setUsuarioResponsable(usuario);
                    p.setFechaPedido(toDate(row.get("fecha_pedido")));
                    p.setFechaProgramada(toDate(row.get("fecha_programada")));
                    p.setFechaEntrega(toDate(row.get("fecha_entrega")));
                    p.setEstado((String) row.get("estado"));

                    Object pagadoObj = row.get("pagado");
                    p.setPagado(pagadoObj != null && "S".equals(pagadoObj.toString()));

                    p.setTotal(row.get("total") != null ? ((BigDecimal) row.get("total")).doubleValue() : 0.0);
                    pedidos.add(p);
                } catch (Exception e) {
                    LOGGER.severe("Error procesando fila de pedido: " + e.getMessage());
                }
            }
        }
        return pedidos;
    }

    /**
     * Lista los productos de un pedido específico.
     * @param idPedido El ID del pedido a consultar.
     * @return Una lista de detalles del pedido.
     */

    public ArrayList<DetallePedido> ListarDetalles(int idPedido) {
        var detalles = new ArrayList<DetallePedido>();
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id_pedido", idPedido, Types.NUMERIC));
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_PEDIDOS.sp_op_listar_detalles", parameters);
        if (result != null) {
            for (Map<String, Object> row : result) {
                Producto producto = new Producto();
                producto.setIdProducto(((BigDecimal) row.get("id_producto")).intValue());
                producto.setNombre((String) row.get("nombre_producto"));

                DetallePedido d = new DetallePedido();
                d.setIdPedido(((BigDecimal) row.get("id_pedido")).intValue());
                d.setProducto(producto);
                d.setCantidad(((BigDecimal) row.get("cantidad")).intValue());
                d.setPrecioUnitario(((BigDecimal) row.get("precio_unitario")).doubleValue());
                detalles.add(d);
            }
        }
        return detalles;
    }

    /**
     * Crea o edita un pedido completo (cabecera y detalles) en una sola transacción.
     * @param pedido   Los datos de la cabecera del pedido.
     * @param detalles La lista de productos que componen el pedido.
     * @return El ID del pedido creado o modificado.
     */
    public int CrearPedidoCompleto(Pedido pedido, List<DetallePedidoArray> detalles) {
        if (pedido.getCliente() == null || pedido.getCliente().getIdCliente() == null) {
            throw new IllegalArgumentException("El pedido debe tener un cliente asignado");
        }
        if (pedido.getUsuarioResponsable() == null || pedido.getUsuarioResponsable().getIdUsuario() == null) {
            throw new IllegalArgumentException("El pedido debe tener un usuario responsable asignado");
        }
        if (pedido.getFechaProgramada() == null) {
            throw new IllegalArgumentException("El pedido debe tener una fecha programada");
        }
        if (pedido.getEstado() == null) {
            throw new IllegalArgumentException("El pedido debe tener un estado asignado");
        }

        ArrayList<Object[]> valores = new ArrayList<>();
        if (detalles != null) {
            detalles.forEach(detalle -> valores.add(detalle.toOracleArray()));
        }

        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", pedido.getIdPedido(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_cli", pedido.getCliente().getIdCliente(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_usu", pedido.getUsuarioResponsable().getIdUsuario(), Types.NUMERIC));
        parameters
                .add(new Parameter<>("p_fecha", new java.sql.Date(pedido.getFechaProgramada().getTime()), Types.DATE));
        parameters.add(new Parameter<>("p_estado", pedido.getEstado(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_pagado", Boolean.TRUE.equals(pedido.getPagado()) ? "S" : "N", Types.VARCHAR));
        parameters.add(
                new Parameter<>("p_detalles", valores, Types.ARRAY, "T_LISTA_DETALLES", "T_DETALLE_PEDIDO", false));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_PEDIDOS.sp_op_crear_pedido_completo", parameters);
    }

    /**
     * Marca un pedido como pagado en la base de datos.
     * @param idPedido El ID del pedido a marcar como pagado.
     * @return El número de filas afectadas.
     */
    public int MarcarPagado(int idPedido) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", idPedido, Types.NUMERIC));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_PEDIDOS.sp_op_marcar_pagado", parameters);
    }

    /**
     * Actualiza el estado de un pedido y asigna el usuario que realiza el cambio.
     * @param idPedido  El ID del pedido a actualizar.
     * @param estado    El nuevo estado del pedido.
     * @param idUsuario El ID del usuario que realiza la actualización.
     * @return El número de filas afectadas.
     */
    public int ActualizarEstado(int idPedido, String estado, Integer idUsuario) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", idPedido, Types.NUMERIC));
        parameters.add(new Parameter<>("p_estado", estado, Types.VARCHAR));
        parameters.add(new Parameter<>("p_id_usuario", idUsuario, Types.NUMERIC));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_PEDIDOS.sp_op_actualizar_estado", parameters);
    }

    /**
     * Elimina un pedido de la base de datos y restaura el stock de los productos asociados.
     * @param idPedido El ID del pedido a eliminar.
     * @return El número de filas afectadas.
     */
    public int EliminarPedido(int idPedido) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", idPedido, Types.NUMERIC));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_PEDIDOS.sp_op_eliminar_pedido", parameters);
    }

}
