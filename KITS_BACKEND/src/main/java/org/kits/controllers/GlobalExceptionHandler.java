package org.kits.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
     *
     * <p>Excepción: los errores de negocio que la BD lanza con
     * {@code RAISE_APPLICATION_ERROR} (rango ORA-20000..20999) se devuelven como 400 con
     * su mensaje, porque están escritos para que los lea el usuario: stock insuficiente,
     * pedido que ya no se puede editar, movimiento de stock inválido, etc.</p>
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        String mensaje = ex.getMessage();

        String mensajeNegocio = extraerErrorDeNegocio(mensaje);
        if (mensajeNegocio != null) {
            return ResponseEntity.badRequest().body(Map.of("error", mensajeNegocio));
        }

        LOGGER.severe("Error no controlado: " + mensaje);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
    }

    /**
     * Extrae el texto de un error de negocio de Oracle, descartando el resto de la pila
     * ({@code ORA-06512: at ...}) que no le sirve de nada al usuario.
     *
     * @return el mensaje listo para mostrar, o {@code null} si no es un error de negocio.
     */
    private String extraerErrorDeNegocio(String mensaje) {
        if (mensaje == null) {
            return null;
        }

        Matcher matcher = ERROR_NEGOCIO.matcher(mensaje);
        if (!matcher.find()) {
            return null;
        }
        return matcher.group(1).trim();
    }

    /** ORA-20000..20999 es el rango reservado para errores propios de la aplicación. */
    private static final Pattern ERROR_NEGOCIO = Pattern.compile("ORA-20\\d{3}:\\s*([^\\r\\n]+)");

    private String mensajeSeguro(String mensaje) {
        return (mensaje == null || mensaje.isBlank()) ? "Solicitud inválida" : mensaje;
    }
}
