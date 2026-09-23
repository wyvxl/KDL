package org.kits.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void errorDeNegocioDeOracleEs400ConSuMensaje() {
        var ex = new RuntimeException("Error en operación de base de datos: ORA-20008: No se puede pasar un pedido de ENTREGADO a CANCELADO.\nORA-06512: at line 1",
                new SQLException());
        var respuesta = handler.handleGeneric(ex);
        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode());
        assertEquals("No se puede pasar un pedido de ENTREGADO a CANCELADO.", respuesta.getBody().get("error"));
    }

    @Test
    void valorDuplicadoEs400EnVezDe500() {
        var ex = new RuntimeException("ORA-00001: unique constraint (KITS.SYS_C008) violated");
        var respuesta = handler.handleGeneric(ex);
        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode());
    }

    @Test
    void errorDesconocidoEs500SinDetalles() {
        var respuesta = handler.handleGeneric(new RuntimeException("NullPointerException en algún lado"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, respuesta.getStatusCode());
        assertEquals("Error interno del servidor", respuesta.getBody().get("error"));
    }
}
