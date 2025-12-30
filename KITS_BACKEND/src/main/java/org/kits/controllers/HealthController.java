package org.kits.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para verificar el estado de salud de la aplicación.
 * Proporciona endpoints para monitorear la conectividad y estado del sistema.
 * Endpoints base: /health
 */
@RestController
@RequestMapping("health")
public class HealthController {

    @Autowired
    private DataSource dataSource;

    /**
     * Endpoint principal de verificación de salud del sistema.
     * GET /health
     * 
     * @return Estado general de la aplicación y conectividad de BD
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());

        // Verificar conexión a base de datos
        try (Connection connection = dataSource.getConnection()) {
            response.put("database", "CONNECTED");
        } catch (Exception e) {
            response.put("database", "DISCONNECTED");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Prueba detallada de conectividad con la base de datos.
     * GET /health/db-test
     * 
     * @return Información detallada de la conexión y prueba de consulta
     */
    @GetMapping("/db-test")
    public ResponseEntity<Map<String, Object>> testDatabase() {
        Map<String, Object> response = new HashMap<>();

        try (Connection connection = dataSource.getConnection()) {
            // Test básico de conexión
            response.put("connected", true);

            // Test de query simple
            try (var stmt = connection.createStatement();
                    var rs = stmt.executeQuery("SELECT 1 FROM DUAL")) {
                if (rs.next()) {
                    response.put("queryTest", "SUCCESS");
                }
            }

        } catch (Exception e) {
            response.put("connected", false);
            response.put("status", "DB_ERROR");
        }

        return ResponseEntity.ok(response);
    }
}