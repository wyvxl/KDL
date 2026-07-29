package org.kits.controllers;

import jakarta.validation.Valid;
import org.kits.bl.LProducto;
import org.kits.dto.AjusteStockDTO;
import org.kits.dto.DisponibilidadProducto;
import org.kits.entities.Producto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.logging.Logger;

/**
 * Controlador REST para la gestión de productos.
 * Proporciona endpoints para CRUD de productos y ajustes de stock.
 * Endpoints base: /producto
 */
@RestController
@RequestMapping("producto")
public class ProductoController {
    private static final Logger logger = Logger.getLogger(ProductoController.class.getName());
    private final LProducto logica;

    @Autowired
    public ProductoController(LProducto logica) {
        this.logica = logica;
    }

    /**
     * Lista todos los productos disponibles en el inventario.
     * GET /producto
     * 
     * @return Lista de productos con información detallada
     */
    @GetMapping
    public ResponseEntity<List<Producto>> Listar() {
        return ResponseEntity.ok(this.logica.Listar());
    }

    /**
     * Catálogo con la disponibilidad de cada producto para una fecha.
     * GET /producto/disponibilidad?fecha=2026-07-29&excluirPedido=12
     *
     * <p>Lo consume la pantalla de toma de pedidos: además del stock físico devuelve
     * cuánto está comprometido en pedidos aún pendientes para esa fecha y cuánto queda
     * libre.</p>
     *
     * @param fecha         Fecha programada del pedido (por defecto, hoy)
     * @param excluirPedido Pedido en edición, para no contarlo contra sí mismo (opcional)
     * @return Lista de productos activos con comprometido y disponible
     */
    @GetMapping("disponibilidad")
    public ResponseEntity<List<DisponibilidadProducto>> Disponibilidad(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Integer excluirPedido) {
        LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();
        return ResponseEntity.ok(this.logica.Disponibilidad(fechaConsulta, excluirPedido));
    }

    /**
     * Consulta un producto específico por su ID.
     * GET /producto/{id}
     *
     * @param idProducto ID del producto a consultar
     * @return Datos del producto encontrado
     */
    @GetMapping("{id}")
    public ResponseEntity<Producto> Consultar(@PathVariable("id") int idProducto) {
        return ResponseEntity.ok(this.logica.Consultar(idProducto));
    }

    /**
     * Crea un nuevo producto o actualiza uno existente.
     * POST /producto
     * 
     * @param producto Objeto con los datos del producto
     * @return ID del producto creado/actualizado
     */
    @PostMapping
    public ResponseEntity<Integer> Guardar(@Valid @RequestBody Producto producto) {
        logger.info("Solicitud para guardar producto: " + producto.getNombre());
        try {
            int result = this.logica.Guardar(producto);
            logger.info("Producto guardado exitosamente con ID: " + result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.severe("Error al guardar producto: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Realiza un ajuste de stock (entrada o salida) para un producto.
     * POST /producto/ajustar-stock
     * 
     * @param ajuste DTO con ID de producto, cantidad y tipo de movimiento
     * @return Respuesta vacía (200 OK) si el ajuste fue correcto
     */
    @PostMapping("ajustar-stock")
    public ResponseEntity<Void> AjustarStock(@Valid @RequestBody AjusteStockDTO ajuste) {
        this.logica.AjustarStock(ajuste.getIdProducto(), ajuste.getCantidad(), ajuste.getMovimiento());
        return ResponseEntity.ok().build();
    }
}
