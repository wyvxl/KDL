package org.kits.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.kits.entities.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utilitario para generar y validar tokens JWT (HS256).
 * El secreto y la expiración se leen de la configuración (application.properties / variables de entorno).
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${jwt.secret}") String secret,
                   @Value("${jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Genera un token firmado para el usuario autenticado.
     * El subject es el nombre de usuario y se incluyen claims con id, rol y nombre completo.
     *
     * <p>La autorización se decide con el claim {@code rol} (nombre del rol), no con
     * {@code idRol}: los ids de ROLES son {@code GENERATED ALWAYS AS IDENTITY} y cambian
     * si se recarga la base o se crean roles nuevos. {@code idRol} se mantiene solo
     * porque el frontend lo usa para mostrar/ocultar controles.</p>
     */
    public String generarToken(Usuario usuario) {
        Date ahora = new Date();
        Date expiracion = new Date(ahora.getTime() + expirationMs);
        return Jwts.builder()
                .subject(usuario.getNombreUsuario())
                .claim("idUsuario", usuario.getIdUsuario())
                .claim("idRol", usuario.getIdRol())
                .claim("rol", usuario.getNombreRol())
                .claim("nombreCompleto", usuario.getNombreCompleto())
                .issuedAt(ahora)
                .expiration(expiracion)
                .signWith(key)
                .compact();
    }

    /**
     * Valida la firma y expiración del token y devuelve sus claims.
     *
     * @throws JwtException si el token es inválido, está expirado o mal formado.
     */
    public Claims parseToken(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
