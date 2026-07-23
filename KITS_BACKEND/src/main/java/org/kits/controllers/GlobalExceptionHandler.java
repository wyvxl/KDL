package org.kits.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Manejador centralizado de excepciones para todos los controladores REST.
 * Devuelve códigos de estado adecuados y evita filtrar trazas internas al cliente.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = Logger.getLogger(GlobalExceptionHandler.class.getName());

    /**
     * Errores de validación de {@code @Valid}: devuelve 400 con el detalle por campo.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errores.put(error.getField(), error.getDefaultMessage()));

        Map<String, Object> body = new HashMap<>();
        body.put("error", "Datos inválidos");
        body.put("detalles", errores);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Argumentos inválidos de la lógica de negocio: 400.
     */
    @ExceptionHandler({IllegalArgumentException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", mensajeSeguro(ex.getMessage())));
    }

    /**
     * Cualquier otro error no controlado: 500 sin exponer la traza interna.
     * Excepción: los errores de "Stock insuficiente" se devuelven como 400 con su mensaje,
     * ya que el frontend depende de ese texto para avisar al usuario.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        String mensaje = ex.getMessage();
        if (mensaje != null && mensaje.contains("Stock insuficiente")) {
            int inicio = mensaje.indexOf("Stock insuficiente");
            String recorte = mensaje.substring(inicio).split("[\\r\\n]", 2)[0];
            return ResponseEntity.badRequest().body(Map.of("error", recorte));
        }
        LOGGER.severe("Error no controlado: " + mensaje);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
    }

    private String mensajeSeguro(String mensaje) {
        return (mensaje == null || mensaje.isBlank()) ? "Solicitud inválida" : mensaje;
    }
}
