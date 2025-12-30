package org.kits.controllers;

import org.kits.bl.LPedido;
import org.kits.dto.DetallePedidoArray;
import org.kits.entities.DetallePedido;
import org.kits.entities.Pedido;
import org.kits.entities.Cliente;
import org.kits.entities.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.logging.Logger;

/**
 * Controlador REST para operaciones de Pedidos.
 * Gestiona la creación, actualización, consulta y cambio de estado de pedidos.
 * Endpoints base: /pedido
 */
@RestController
@RequestMapping("pedido")
@CrossOrigin(origins = "http://localhost:5173") // Solo permitir Frontend de desarrollo
public class PedidoController {

    private static final Logger LOGGER = Logger.getLogger(PedidoController.class.getName());
    private final LPedido logica;

    @Autowired
    public PedidoController(LPedido logica) {
        this.logica = logica;
    }

    /**
     * Lista todos los pedidos registrados en el sistema.
     * GET /pedido
     *
     * @return Lista de pedidos (cabeceras)
     */
    @GetMapping
    public ResponseEntity<List<Pedido>> Listar() {
        return ResponseEntity.ok(this.logica.Listar());
    }

    /**
     * Lista los detalles (productos) asociados a un pedido.
     * GET /pedido/{id}/detalles
     *
     * @param idPedido Identificador del pedido
     * @return Lista de detalles del pedido
     */
    @GetMapping("{id}/detalles")
    public ResponseEntity<List<DetallePedido>> ListarDetalles(@PathVariable("id") int idPedido) {
        return ResponseEntity.ok(this.logica.ListarDetalles(idPedido));
    }

    /**
     * Crea un pedido completo (cabecera + detalles) en una sola transacción.
     * POST /pedido
     *
     * @param request Datos del pedido completo
     * @return ID del pedido creado o error si no hay stock
     */
    @PostMapping
    public ResponseEntity<?> CrearPedidoCompleto(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> pedidoData = (Map<String, Object>) request.get("pedido");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> detallesData = (List<Map<String, Object>>) request.get("detalles");

            Pedido pedido = mapToPedido(pedidoData);
            List<DetallePedidoArray> detalles = mapToDetalles(detallesData);

            int idPedido = this.logica.CrearPedidoCompleto(pedido, detalles);
            return ResponseEntity.ok(idPedido);
        } catch (Exception e) {
            LOGGER.severe("Error creando pedido: " + e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("Stock insuficiente")) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(500).body(Map.of("error", "Error: " + e.getMessage()));
        }
    }

    private Pedido mapToPedido(Map<String, Object> data) {
        try {
            Pedido pedido = new Pedido();

            // Mapear ID del pedido si existe (para edición)
            Object idPedidoObj = data.get("idPedido");
            if (idPedidoObj != null) {
                pedido.setIdPedido(((Number) idPedidoObj).intValue());
            }

            Cliente cliente = new Cliente();
            Object idClienteObj = data.get("idCliente");
            if (idClienteObj == null)
                throw new IllegalArgumentException("idCliente es requerido");
            cliente.setIdCliente(((Number) idClienteObj).intValue());
            pedido.setCliente(cliente);

            Usuario usuario = new Usuario();
            Object idUsuarioObj = data.get("idUsuario");
            if (idUsuarioObj == null)
                throw new IllegalArgumentException("idUsuario es requerido");
            usuario.setIdUsuario(((Number) idUsuarioObj).intValue());
            pedido.setUsuarioResponsable(usuario);

            Object fechaObj = data.get("fechaProgramada");
            if (fechaObj == null)
                throw new IllegalArgumentException("fechaProgramada es requerida");
            pedido.setFechaProgramada(new java.util.Date(((Number) fechaObj).longValue()));

            String estado = (String) data.get("estado");
            pedido.setEstado(estado != null ? estado : "PENDIENTE");

            Boolean pagado = (Boolean) data.get("pagado");
            pedido.setPagado(pagado != null ? pagado : false);

            return pedido;
        } catch (Exception e) {
            throw new RuntimeException("Error mapeando pedido: " + e.getMessage(), e);
        }
    }

    private List<DetallePedidoArray> mapToDetalles(List<Map<String, Object>> detallesData) {
        List<DetallePedidoArray> detalles = new ArrayList<>();
        if (detallesData != null) {
            for (int i = 0; i < detallesData.size(); i++) {
                try {
                    Map<String, Object> detalle = detallesData.get(i);
                    DetallePedidoArray d = new DetallePedidoArray();

                    Object idProductoObj = detalle.get("idProducto");
                    if (idProductoObj == null)
                        throw new IllegalArgumentException("idProducto es requerido en detalle " + i);
                    d.setIdProducto(((Number) idProductoObj).intValue());

                    Object cantidadObj = detalle.get("cantidad");
                    if (cantidadObj == null)
                        throw new IllegalArgumentException("cantidad es requerida en detalle " + i);
                    d.setCantidad(((Number) cantidadObj).intValue());

                    Object precioObj = detalle.get("precio");
                    if (precioObj == null)
                        throw new IllegalArgumentException("precio es requerido en detalle " + i);
                    d.setPrecio(((Number) precioObj).doubleValue());

                    detalles.add(d);
                } catch (Exception e) {
                    throw new RuntimeException("Error mapeando detalle " + i + ": " + e.getMessage(), e);
                }
            }
        }
        return detalles;
    }

    /**
     * Actualiza el estado de un pedido (ej. PENDIENTE -> ENTREGADO).
     * PUT /pedido/{id}/estado
     * Body esperado: { "estado": "NUEVO_ESTADO" }
     *
     * @param idPedido ID del pedido
     * @param payload  Mapa con el nuevo estado
     * @return 1 si la actualización fue exitosa
     */
    @PutMapping("{id}/estado")
    public ResponseEntity<Integer> ActualizarEstado(
            @PathVariable("id") int idPedido,
            @RequestBody Map<String, Object> payload) {
        String estado = (String) payload.get("estado");
        Integer idUsuario = null;
        if (payload.get("idUsuario") != null) {
            idUsuario = ((Number) payload.get("idUsuario")).intValue();
        }
        return ResponseEntity.ok(this.logica.ActualizarEstado(idPedido, estado, idUsuario));
    }

    /**
     * Marca un pedido como pagado.
     * PUT /pedido/{id}/pagado
     *
     * @param idPedido ID del pedido
     * @return 1 si la actualización fue exitosa
     */
    @PutMapping("{id}/pagado")
    public ResponseEntity<Integer> MarcarPagado(@PathVariable("id") int idPedido) {
        return ResponseEntity.ok(this.logica.MarcarPagado(idPedido));
    }

    /**
     * Elimina un pedido.
     * DELETE /pedido/{id}
     *
     * @param idPedido ID del pedido
     * @return 1 si la eliminación fue exitosa
     */
    @DeleteMapping("{id}")
    public ResponseEntity<Integer> Eliminar(@PathVariable("id") int idPedido) {
        return ResponseEntity.ok(this.logica.EliminarPedido(idPedido));
    }

}
