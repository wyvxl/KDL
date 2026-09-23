package org.kits.bl;

import org.kits.db.ConnectionManager;
import org.kits.db.Operations;
import org.kits.dto.DetallePedidoArray;
import org.kits.dto.Parameter;
import org.kits.dto.ProduccionRequerida;
import org.kits.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Se encarga de la comunicación con la base de datos y la transformación de datos.
 */
@Component
public class LPedido extends Operations {

    @Autowired
    public LPedido(ConnectionManager connectionManager) {
        super(connectionManager);
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
            // Sin try/catch por fila: antes una fila que fallaba al mapearse se descartaba
            // y el pedido desaparecía de la lista sin que nadie se enterara.
            for (Map<String, Object> row : result) {
                Cliente cliente = new Cliente();
                cliente.setIdCliente(toInt(row.get("id_cliente")));
                cliente.setNombre((String) row.get("nombre_cliente"));

                Usuario usuario = new Usuario();
                usuario.setIdUsuario(toInt(row.get("id_usuario_responsable")));
                usuario.setNombreCompleto((String) row.get("nombre_usuario"));

                Pedido p = new Pedido();
                p.setIdPedido(toInt(row.get("id_pedido")));
                p.setCliente(cliente);
                p.setUsuarioResponsable(usuario);
                p.setFechaPedido(toDate(row.get("fecha_pedido")));
                p.setFechaProgramada(toDate(row.get("fecha_programada")));
                p.setFechaEntrega(toDate(row.get("fecha_entrega")));
                p.setEstado((String) row.get("estado"));

                Object pagadoObj = row.get("pagado");
                p.setPagado(pagadoObj != null && "S".equals(pagadoObj.toString()));

                Double total = toDouble(row.get("total"));
                p.setTotal(total != null ? total : 0.0);
                pedidos.add(p);
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
                producto.setIdProducto(toInt(row.get("id_producto")));
                producto.setNombre((String) row.get("nombre_producto"));

                DetallePedido d = new DetallePedido();
                d.setIdPedido(toInt(row.get("id_pedido")));
                d.setProducto(producto);
                d.setCantidad(toInt(row.get("cantidad")));
                d.setPrecioUnitario(toDouble(row.get("precio_unitario")));
                detalles.add(d);
            }
        }
        return detalles;
    }

    /**
     * Parte de producción de cocina para una fecha: qué hay que hornear ese día.
     *
     * <p>Agrupa por producto las cantidades de todos los pedidos programados para esa
     * fecha que siguen activos, separando lo que aún no salió del inventario
     * ({@code porPreparar}) de lo que cocina ya tomó ({@code yaAlistado}).</p>
     *
     * @param fecha Fecha de producción a consultar
     * @return Líneas del parte, ordenadas por nombre de producto
     */
    public List<ProduccionRequerida> ProduccionRequerida(LocalDate fecha) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_fecha", java.sql.Date.valueOf(fecha), Types.DATE));
        parameters.add(createResponseParameter());

        var produccion = new ArrayList<ProduccionRequerida>();
        List<Map<String, Object>> result = executeQuery("PKG_PEDIDOS.sp_op_produccion_requerida", parameters);
        if (result != null) {
            for (Map<String, Object> row : result) {
                produccion.add(new ProduccionRequerida(
                        toInt(row.get("id_producto")),
                        (String) row.get("nombre"),
                        (String) row.get("unidad_medida"),
                        toInt(row.get("stock_actual")),
                        toInt(row.get("por_preparar")),
                        toInt(row.get("ya_alistado")),
                        toInt(row.get("faltante"))));
            }
        }
        return produccion;
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
