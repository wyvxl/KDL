package org.kits.controllers;

import jakarta.validation.Valid;
import org.kits.bl.LCliente;
import org.kits.entities.Cliente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la gestión de Clientes.
 * Expone endpoints para listar, consultar, guardar y dar de baja clientes.
 * Mapeo base: /cliente
 *
 * <p>Los errores se dejan subir a {@link GlobalExceptionHandler}, que decide el código
 * y el mensaje. Antes se capturaban aquí y se devolvía un 500 vacío, con lo que el
 * frontend no podía distinguir "no hay clientes" de "algo falló".</p>
 */
@RestController
@RequestMapping("cliente")
public class ClienteController {
    private final LCliente logica;

    @Autowired
    public ClienteController(LCliente logica) {
        this.logica = logica;
    }

    /**
     * Endpoint para obtener el listado de clientes.
     * GET /cliente?incluirInactivos=true
     *
     * @param incluirInactivos true para incluir los dados de baja (pantalla de
     *                         mantenimiento). Por defecto solo devuelve los activos,
     *                         que es lo que necesita la toma de pedidos.
     * @return ResponseEntity con la lista de clientes
     */
    @GetMapping
    public ResponseEntity<List<Cliente>> Listar(
            @RequestParam(required = false, defaultValue = "false") boolean incluirInactivos) {
        return ResponseEntity.ok(this.logica.Listar(incluirInactivos));
    }

    /**
     * Endpoint para consultar un cliente específico por ID.
     * GET /cliente/{id}
     *
     * @param idCliente ID del cliente a buscar
     * @return ResponseEntity con el cliente encontrado
     */
    @GetMapping("{id}")
    public ResponseEntity<Cliente> Consultar(@PathVariable("id") int idCliente) {
        return ResponseEntity.ok(this.logica.Consultar(idCliente));
    }

    /**
     * Endpoint para crear o actualizar un cliente.
     * POST /cliente
     *
     * @param cliente Objeto Cliente con los datos a guardar
     * @return ResponseEntity con el ID del cliente guardado
     */
    @PostMapping
    public ResponseEntity<Integer> Guardar(@Valid @RequestBody Cliente cliente) {
        return ResponseEntity.ok(this.logica.Guardar(cliente));
    }

    /**
     * Da de baja un cliente.
     * DELETE /cliente/{id}
     *
     * <p>Es una baja lógica: la fila se conserva porque los pedidos la referencian y su
     * historial tiene que seguir siendo consultable. El cliente solo deja de aparecer al
     * tomar pedidos nuevos, y puede reactivarse.</p>
     *
     * @param idCliente ID del cliente
     * @return Número de filas afectadas
     */
    @DeleteMapping("{id}")
    public ResponseEntity<Integer> Eliminar(@PathVariable("id") int idCliente) {
        return ResponseEntity.ok(this.logica.Eliminar(idCliente));
    }

    /**
     * Reactiva un cliente dado de baja.
     * PUT /cliente/{id}/activar
     *
     * @param idCliente ID del cliente
     * @return Número de filas afectadas
     */
    @PutMapping("{id}/activar")
    public ResponseEntity<Integer> Activar(@PathVariable("id") int idCliente) {
        return ResponseEntity.ok(this.logica.Activar(idCliente));
    }
}
