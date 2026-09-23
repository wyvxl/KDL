package org.kits.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PermisosPedidoTest {

    private static Authentication conRol(String rol) {
        return new UsernamePasswordAuthenticationToken("u", null, List.of(new SimpleGrantedAuthority("ROLE_" + rol)));
    }

    @Test
    void adminPuedeCualquierEstado() {
        for (String estado : List.of("EN_PROCESO", "LISTO", "ENTREGADO", "CANCELADO", "PENDIENTE")) {
            assertTrue(PermisosPedido.puedeCambiarA(conRol("ADMIN"), estado), estado);
        }
    }

    @Test
    void vendedorSoloCancela() {
        assertTrue(PermisosPedido.puedeCambiarA(conRol("VENDEDOR"), "CANCELADO"));
        assertFalse(PermisosPedido.puedeCambiarA(conRol("VENDEDOR"), "EN_PROCESO"));
        assertFalse(PermisosPedido.puedeCambiarA(conRol("VENDEDOR"), "ENTREGADO"));
    }

    @Test
    void cocinaYRepartoAvanzanPeroNoCancelan() {
        for (String rol : List.of("PANADERO", "REPARTIDOR")) {
            assertTrue(PermisosPedido.puedeCambiarA(conRol(rol), "EN_PROCESO"), rol);
            assertTrue(PermisosPedido.puedeCambiarA(conRol(rol), "LISTO"), rol);
            assertTrue(PermisosPedido.puedeCambiarA(conRol(rol), "ENTREGADO"), rol);
            assertFalse(PermisosPedido.puedeCambiarA(conRol(rol), "CANCELADO"), rol);
        }
    }

    @Test
    void nadieFueraDeAdminVuelveAPendiente() {
        for (String rol : List.of("VENDEDOR", "PANADERO", "REPARTIDOR")) {
            assertFalse(PermisosPedido.puedeCambiarA(conRol(rol), "PENDIENTE"), rol);
        }
    }

    @Test
    void soloAdminFijaEstadoAlGuardar() {
        assertTrue(PermisosPedido.puedeFijarEstadoAlGuardar(conRol("ADMIN")));
        assertFalse(PermisosPedido.puedeFijarEstadoAlGuardar(conRol("VENDEDOR")));
        assertFalse(PermisosPedido.puedeFijarEstadoAlGuardar(null));
    }
}
