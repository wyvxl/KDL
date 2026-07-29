package org.kits.controllers;

import org.kits.bl.LPedido;
import org.kits.dto.DetallePedidoArray;
import org.kits.dto.ProduccionRequerida;
import org.kits.entities.DetallePedido;
import org.kits.entities.Pedido;
import org.kits.entities.Cliente;
import org.kits.entities.Usuario;
import org.kits.security.UsuarioAutenticado;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

/**
 * Controlador REST para operaciones de Pedidos.
 * Gestiona la creación, actualización, consulta y cambio de estado de pedidos.
 * Endpoints base: /pedido
 * (CORS se gestiona de forma centralizada en SecurityConfig.)
 */
@RestController
@RequestMapping("pedido")
public class PedidoController {

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
     * Parte de producción de cocina para una fecha.
     * GET /pedido/produccion?fecha=2026-07-29
     *
     * <p>Agrupa por producto lo que hay que tener listo ese día, separando lo que todavía
     * está pendiente de lo que cocina ya tomó, y cuánto falta hornear.</p>
     *
     * @param fecha Fecha de producción (por defecto, hoy)
     * @return Líneas del parte de producción
     */
    @GetMapping("produccion")
    public ResponseEntity<List<ProduccionRequerida>> Produccion(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();
        return ResponseEntity.ok(this.logica.ProduccionRequerida(fechaConsulta));
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
    public ResponseEntity<Integer> CrearPedidoCompleto(@RequestBody Map<String, Object> request,
                                                       Authentication authentication) {
        @SuppressWarnings("unchecked")
        Map<String, Object> pedidoData = (Map<String, Object>) request.get("pedido");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> detallesData = (List<Map<String, Object>>) request.get("detalles");

        if (pedidoData == null) {
            throw new IllegalArgumentException("El cuerpo debe incluir el objeto 'pedido'");
        }

        Pedido pedido = mapToPedido(pedidoData, idUsuarioAutenticado(authentication));
        List<DetallePedidoArray> detalles = mapToDetalles(detallesData);

        // Los errores de negocio (stock insuficiente, pedido ya no editable) los traduce
        // GlobalExceptionHandler a 400 con el mensaje de la BD.
        return ResponseEntity.ok(this.logica.CrearPedidoCompleto(pedido, detalles));
    }

    /**
     * Id del usuario que hace la petición, tomado del token.
     *
     * <p>Nunca del cuerpo: si viniera en el JSON, cualquier usuario autenticado podría
     * atribuirle un pedido o un cambio de estado a otra persona.</p>
     */
    private Integer idUsuarioAutenticado(Authentication authentication) {
        Integer idUsuario = UsuarioAutenticado.idDe(authentication);
        if (idUsuario == null) {
            throw new IllegalArgumentException("No se pudo identificar al usuario de la sesión");
        }
        return idUsuario;
    }

    private Pedido mapToPedido(Map<String, Object> data, Integer idUsuarioResponsable) {
        Pedido pedido = new Pedido();

        // Mapear ID del pedido si existe (para edición)
        pedido.setIdPedido(numeroOpcional(data.get("idPedido")));

        Cliente cliente = new Cliente();
        cliente.setIdCliente(numeroRequerido(data.get("idCliente"), "idCliente"));
        pedido.setCliente(cliente);

        // El responsable es quien está autenticado; se ignora cualquier idUsuario del cuerpo.
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(idUsuarioResponsable);
        pedido.setUsuarioResponsable(usuario);

        Object fechaObj = data.get("fechaProgramada");
        if (fechaObj == null) {
            throw new IllegalArgumentException("fechaProgramada es requerida");
        }
        pedido.setFechaProgramada(parsearFechaProgramada(fechaObj));

        String estado = (String) data.get("estado");
        pedido.setEstado(estado != null ? estado : "PENDIENTE");

        Boolean pagado = (Boolean) data.get("pagado");
        pedido.setPagado(pagado != null ? pagado : false);

        return pedido;
    }

    /**
     * Interpreta la fecha programada que envía el frontend.
     *
     * <p>Se acepta {@code "yyyy-MM-dd"} y se construye la fecha en la zona del servidor.
     * Es importante no usar {@code new Date(epochMillis)} con una fecha ISO suelta: el
     * navegador parsea {@code "2026-07-29"} como medianoche UTC y, al convertirla a la
     * zona local (UTC-6), la JVM la guardaba como el día anterior.</p>
     *
     * <p>También se admite un epoch en milisegundos por compatibilidad con clientes
     * antiguos.</p>
     */
    private java.util.Date parsearFechaProgramada(Object fechaObj) {
        if (fechaObj instanceof Number epochMillis) {
            return new java.util.Date(epochMillis.longValue());
        }

        String texto = fechaObj.toString().trim();
        try {
            // Solo interesa el día; se ignora cualquier parte horaria que venga detrás.
            LocalDate fecha = LocalDate.parse(texto.length() > 10 ? texto.substring(0, 10) : texto);
            return java.sql.Date.valueOf(fecha);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("fechaProgramada debe tener formato yyyy-MM-dd: " + texto);
        }
    }

    private Integer numeroRequerido(Object valor, String campo) {
        if (!(valor instanceof Number numero)) {
            throw new IllegalArgumentException(campo + " es requerido y debe ser numérico");
        }
        return numero.intValue();
    }

    private Integer numeroOpcional(Object valor) {
        return valor instanceof Number numero ? numero.intValue() : null;
    }

    private List<DetallePedidoArray> mapToDetalles(List<Map<String, Object>> detallesData) {
        List<DetallePedidoArray> detalles = new ArrayList<>();
        if (detallesData != null) {
            for (int i = 0; i < detallesData.size(); i++) {
                Map<String, Object> detalle = detallesData.get(i);
                DetallePedidoArray d = new DetallePedidoArray();

                d.setIdProducto(numeroRequerido(detalle.get("idProducto"), "idProducto en detalle " + i));
                d.setCantidad(numeroRequerido(detalle.get("cantidad"), "cantidad en detalle " + i));

                Object precioObj = detalle.get("precio");
                if (!(precioObj instanceof Number precio)) {
                    throw new IllegalArgumentException("precio es requerido en detalle " + i);
                }
                d.setPrecio(precio.doubleValue());

                if (d.getCantidad() <= 0) {
                    throw new IllegalArgumentException("La cantidad del detalle " + i + " debe ser mayor que cero");
                }

                detalles.add(d);
            }
        }
        return detalles;
    }

    /**
     * Actualiza el estado de un pedido (ej. PENDIENTE -> EN_PROCESO).
     * PUT /pedido/{id}/estado
     * Body esperado: { "estado": "NUEVO_ESTADO" }
     *
     * <p>El pedido queda a nombre del usuario autenticado, que es quien realmente hizo
     * el movimiento.</p>
     *
     * @param idPedido ID del pedido
     * @param payload  Mapa con el nuevo estado
     * @return 1 si la actualización fue exitosa
     */
    @PutMapping("{id}/estado")
    public ResponseEntity<Integer> ActualizarEstado(
            @PathVariable("id") int idPedido,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        String estado = (String) payload.get("estado");
        if (estado == null || estado.isBlank()) {
            throw new IllegalArgumentException("estado es requerido");
        }
        return ResponseEntity.ok(
                this.logica.ActualizarEstado(idPedido, estado, idUsuarioAutenticado(authentication)));
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
