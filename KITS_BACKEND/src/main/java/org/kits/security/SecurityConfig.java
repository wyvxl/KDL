package org.kits.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuración de seguridad: autenticación stateless por JWT y autorización por rol.
 *
 * <p>Los roles reflejan los permisos ya calculados en {@code LUsuario.obtenerPermisosPorRol}:
 * Admin/Pruebas (idRol 1 y 4) ven todo; Repartidor (idRol 2) solo pedidos (lectura y cambio de
 * estado); Panadero (idRol 3) pedidos (todo) y productos.</p>
 *
 * <ul>
 *   <li>Público: login ({@code POST /usuario/autenticar}) y health.</li>
 *   <li>Solo ADMIN: gestión de usuarios ({@code /usuario/**}), roles ({@code /rol/**}) y clientes ({@code /cliente/**}).</li>
 *   <li>ADMIN o PANADERO: productos ({@code /producto/**}) y la mayoría de operaciones sobre pedidos.</li>
 *   <li>ADMIN, REPARTIDOR o PANADERO: consultar pedidos y cambiar su estado
 *       ({@code GET /pedido/**}, {@code PUT /pedido/{id}/estado}) — el Repartidor no puede
 *       crear, marcar como pagado ni eliminar pedidos.</li>
 *   <li>Resto de endpoints: requiere estar autenticado.</li>
 * </ul>
 */
@Configuration
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final String corsAllowedOrigin;

    public SecurityConfig(JwtUtil jwtUtil, @Value("${app.cors.allowed-origin}") String corsAllowedOrigin) {
        this.jwtUtil = jwtUtil;
        this.corsAllowedOrigin = corsAllowedOrigin;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/usuario/autenticar").permitAll()
                        .requestMatchers("/health", "/health/**").permitAll()
                        .requestMatchers("/usuario/**").hasRole("ADMIN")
                        .requestMatchers("/rol/**").hasRole("ADMIN")
                        .requestMatchers("/cliente/**").hasRole("ADMIN")
                        .requestMatchers("/producto/**").hasAnyRole("ADMIN", "PANADERO")
                        // Repartidor solo puede consultar pedidos y cambiar su estado (Procesar/Listo/Entregar).
                        .requestMatchers(HttpMethod.GET, "/pedido/**").hasAnyRole("ADMIN", "REPARTIDOR", "PANADERO")
                        .requestMatchers(HttpMethod.PUT, "/pedido/*/estado").hasAnyRole("ADMIN", "REPARTIDOR", "PANADERO")
                        // Crear, marcar pagado y eliminar pedidos: Repartidor excluido.
                        .requestMatchers("/pedido/**").hasAnyRole("ADMIN", "PANADERO")
                        .anyRequest().authenticated()
                )
                // Para una API stateless: 401 cuando falta/expira el token en vez de redirigir.
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(new JwtAuthFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(corsAllowedOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
