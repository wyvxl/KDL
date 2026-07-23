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

/**
 * Filtro que extrae el token JWT del encabezado Authorization (Bearer),
 * lo valida y establece la autenticación en el contexto de seguridad.
 * Si el token es inválido o ausente, la petición sigue sin autenticación
 * (las reglas de autorización decidirán si se permite o se rechaza con 401/403).
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            try {
                Claims claims = jwtUtil.parseToken(token);
                String usuario = claims.getSubject();
                int idRol = claims.get("idRol") != null ? ((Number) claims.get("idRol")).intValue() : 0;
                var authorities = List.of(new SimpleGrantedAuthority(rolAAuthority(idRol)));
                var authentication = new UsernamePasswordAuthenticationToken(usuario, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException | ClassCastException e) {
                // Token inválido/expirado: se limpia el contexto y se sigue sin autenticación.
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    /**
     * Mapea el id de rol de la BD a una authority de Spring Security.
     * 1 y 4 son administradores; 2 repartidor; 3 panadero.
     */
    static String rolAAuthority(int idRol) {
        return switch (idRol) {
            case 1, 4 -> "ROLE_ADMIN";
            case 2 -> "ROLE_REPARTIDOR";
            case 3 -> "ROLE_PANADERO";
            default -> "ROLE_USER";
        };
    }
}
