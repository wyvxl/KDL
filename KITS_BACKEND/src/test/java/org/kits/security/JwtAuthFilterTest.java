package org.kits.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.kits.entities.Rol;
import org.kits.entities.Usuario;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.function.IntFunction;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class JwtAuthFilterTest {

    private final JwtUtil jwtUtil = new JwtUtil("clave-de-pruebas-con-al-menos-32-caracteres!!", 60_000);

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private String tokenPara(int id, String rol) {
        Rol r = new Rol();
        r.setIdRol(1);
        r.setNombreRol(rol);
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        u.setNombreUsuario("usuario" + id);
        u.setRol(r);
        return jwtUtil.generarToken(u);
    }

    private Authentication filtrar(String token, IntFunction<String> rolVigente) throws Exception {
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        new JwtAuthFilter(jwtUtil, rolVigente).doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        return SecurityContextHolder.getContext().getAuthentication();
    }

    @Test
    void autenticaSiElUsuarioSigueActivoConElMismoRol() throws Exception {
        Authentication auth = filtrar(tokenPara(7, "Vendedor"), id -> "VENDEDOR");
        assertNotNull(auth);
        assertEquals(7, UsuarioAutenticado.idDe(auth));
        assertEquals("ROLE_VENDEDOR", auth.getAuthorities().iterator().next().getAuthority());
    }

    @Test
    void rechazaTokenDeUsuarioDesactivado() throws Exception {
        assertNull(filtrar(tokenPara(7, "VENDEDOR"), id -> null));
    }

    @Test
    void rechazaTokenSiCambioElRol() throws Exception {
        assertNull(filtrar(tokenPara(7, "ADMIN"), id -> "VENDEDOR"));
    }

    @Test
    void rechazaTokenInvalido() throws Exception {
        assertNull(filtrar("no-es-un-jwt", id -> "ADMIN"));
    }

    @Test
    void normalizaNombreDeRol() {
        assertEquals("ROLE_JEFE_DE_COCINA", JwtAuthFilter.rolAAuthority(" jefe de cocina "));
        assertNull(JwtAuthFilter.rolAAuthority(" "));
    }
}
