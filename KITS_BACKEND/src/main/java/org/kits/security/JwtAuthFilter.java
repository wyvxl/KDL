package org.kits.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.function.IntFunction;

/**
 * Filtro que extrae el token JWT del encabezado Authorization (Bearer),
 * lo valida y establece la autenticación en el contexto de seguridad.
 * Si el token es inválido o ausente, la petición sigue sin autenticación
 * (las reglas de autorización decidirán si se permite o se rechaza con 401/403).
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtUtil jwtUtil;
    private final IntFunction<String> rolVigente;

    /**
     * @param rolVigente devuelve el nombre del rol que el usuario tiene <em>ahora</em> en la
     *                   BD, o {@code null} si ya no existe o está desactivado. Se consulta en
     *                   cada petición porque el token vive 24 h: sin esto, desactivar a alguien
     *                   o cambiarle el rol no tenía efecto hasta que el token expiraba.
     */
    public JwtAuthFilter(JwtUtil jwtUtil, IntFunction<String> rolVigente) {
        this.jwtUtil = jwtUtil;
        this.rolVigente = rolVigente;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            try {
                Claims claims = jwtUtil.parseToken(token);
                String authority = rolAAuthority(claims.get("rol", String.class));
                Object idUsuario = claims.get("idUsuario");

                if (authority == null || !(idUsuario instanceof Number id)) {
                    // Token incompleto (p. ej. emitido por una versión anterior). Se deja
                    // sin autenticar para que devuelva 401 y el frontend cierre sesión.
                    SecurityContextHolder.clearContext();
                } else if (!authority.equals(rolAAuthority(rolVigente.apply(id.intValue())))) {
                    // Usuario desactivado o con otro rol desde que se emitió el token:
                    // 401 para que vuelva a iniciar sesión y reciba sus permisos actuales.
                    SecurityContextHolder.clearContext();
                } else {
                    // El principal lleva el id además del nombre: los controladores lo usan
                    // para registrar quién hace cada operación, en vez de creerle al cuerpo.
                    var principal = new UsuarioAutenticado(id.intValue(), claims.getSubject());
                    var authorities = List.of(new SimpleGrantedAuthority(authority));
                    var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException | ClassCastException e) {
                // Token inválido/expirado: se limpia el contexto y se sigue sin autenticación.
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    /**
     * Convierte el nombre del rol de la BD (ROLES.nombre_rol) en una authority de Spring Security.
     *
     * <p>Se mapea por nombre y no por id porque los ids son {@code GENERATED ALWAYS AS IDENTITY}:
     * recargar la base o crear un rol nuevo los desplaza y la autorización quedaría mal asignada.</p>
     *
     * <p>Un rol que no coincida con ninguna regla de {@link SecurityConfig} solo podrá llegar a los
     * endpoints públicos, que es el comportamiento seguro por defecto.</p>
     *
     * @return la authority, o {@code null} si el token no trae rol.
     */
    static String rolAAuthority(String nombreRol) {
        if (nombreRol == null || nombreRol.isBlank()) {
            return null;
        }
        String normalizado = nombreRol.trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_");
        return "ROLE_" + normalizado;
    }
}
