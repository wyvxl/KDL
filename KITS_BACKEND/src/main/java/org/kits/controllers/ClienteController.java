package org.kits.controllers;

import org.kits.bl.LCliente;
import org.kits.entities.Cliente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.logging.Logger;

/**
 * Controlador REST para la gestión de Clientes.
 * Expone endpoints para listar, consultar y guardar clientes.
 * Mapeo base: /cliente
 */
@RestController
@RequestMapping("cliente")
public class ClienteController {
    private final LCliente logica;
    private static final Logger logger = Logger.getLogger(ClienteController.class.getName());

    @Autowired
    public ClienteController(LCliente logica) {
        this.logica = logica;
    }

    /**
     * Endpoint para obtener el listado de todos los clientes.
     * GET /cliente
     * 
     * @return ResponseEntity con la lista de clientes o error 500
     */
    @GetMapping
    public ResponseEntity<List<Cliente>> Listar() {


        try {
            logger.info(">>> INICIANDO LISTADO DE CLIENTES");
            List<Cliente> clientes = this.logica.Listar();
            logger.info(">>> CLIENTES ENCONTRADOS: " + clientes.size());
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            logger.severe(">>> ERROR AL LISTAR CLIENTES: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Endpoint para consultar un cliente específico por ID.
     * GET /cliente/{id}
     * 
     * @param idCliente ID del cliente a buscar
     * @return ResponseEntity con el cliente encontrado o 404/500
     */
    @GetMapping("{id}")
    public ResponseEntity<Cliente> Consultar(@PathVariable("id") int idCliente) {
        try {
            Cliente cliente = this.logica.Consultar(idCliente);
            if (cliente != null) {
                return ResponseEntity.ok(cliente);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.severe(">>> ERROR AL CONSULTAR CLIENTE: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Endpoint para crear o actualizar un cliente.
     * POST /cliente
     * 
     * @param cliente Objeto Cliente con los datos a guardar
     * @return ResponseEntity con el ID del cliente guardado o error 500
     */
    @PostMapping
    public ResponseEntity<Integer> Guardar(@RequestBody Cliente cliente) {
        try {
            int resultado = this.logica.Guardar(cliente);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            logger.severe(">>> ERROR AL GUARDAR CLIENTE: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
