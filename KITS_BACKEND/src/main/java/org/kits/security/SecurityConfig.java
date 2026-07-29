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
 * <p>Las authorities salen del <em>nombre</em> del rol en la BD (ver
 * {@link JwtAuthFilter#rolAAuthority}), no de su id. Los permisos reflejan cómo trabaja
 * la panadería:</p>
 *
 * <table>
 *   <caption>Reparto de responsabilidades</caption>
 *   <tr><th>Rol</th><th>Pedidos</th><th>Clientes</th><th>Productos</th><th>Usuarios/Roles</th></tr>
 *   <tr><td>ADMIN</td><td>todo</td><td>todo</td><td>todo</td><td>todo</td></tr>
 *   <tr><td>VENDEDOR</td><td>crear, editar, cobrar, cancelar, eliminar</td><td>todo</td><td>solo consulta</td><td>—</td></tr>
 *   <tr><td>PANADERO</td><td>consultar y avanzar estado</td><td>—</td><td>todo (produce y ajusta stock)</td><td>—</td></tr>
 *   <tr><td>REPARTIDOR</td><td>consultar y avanzar estado</td><td>—</td><td>—</td><td>—</td></tr>
 * </table>
 *
 * <p>El VENDEDOR toma los pedidos (teléfono/redes) y por eso necesita clientes y el catálogo
 * de productos. El PANADERO no crea pedidos: los ve, los alista y repone inventario.</p>
 *
 * <p>Un rol que no aparezca aquí queda sin acceso a ningún endpoint de negocio: es el
 * comportamiento seguro por defecto para roles creados desde {@code POST /rol}.</p>
 *
 * <p>Excepción transversal: {@code PUT /usuario/mi-contrasena} lo puede usar cualquier
 * usuario autenticado para cambiar su propia contraseña.</p>
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

                        // Cambiar la contraseña propia: cualquier usuario autenticado.
                        // El usuario afectado sale del token, así que nadie puede tocar la
                        // de otro. Debe ir ANTES de la regla /usuario/** de abajo.
                        .requestMatchers(HttpMethod.PUT, "/usuario/mi-contrasena").authenticated()

                        // Administración del sistema (incluye restablecer contraseñas ajenas).
                        .requestMatchers("/usuario/**").hasRole("ADMIN")
                        .requestMatchers("/rol/**").hasRole("ADMIN")

                        // Clientes: los necesita quien toma los pedidos.
                        .requestMatchers("/cliente/**").hasAnyRole("ADMIN", "VENDEDOR")

                        // Productos: el vendedor consulta catálogo y disponibilidad para poder
                        // prometer; crear productos y mover stock es de cocina.
                        .requestMatchers(HttpMethod.GET, "/producto/**").hasAnyRole("ADMIN", "PANADERO", "VENDEDOR")
                        .requestMatchers("/producto/**").hasAnyRole("ADMIN", "PANADERO")

                        // Parte de producción: es la pantalla de cocina.
                        .requestMatchers(HttpMethod.GET, "/pedido/produccion").hasAnyRole("ADMIN", "PANADERO")
                        // Consultar pedidos: todos los roles operativos.
                        .requestMatchers(HttpMethod.GET, "/pedido/**")
                            .hasAnyRole("ADMIN", "VENDEDOR", "PANADERO", "REPARTIDOR")
                        // Cambiar el estado: cocina y reparto lo avanzan (Procesar/Listo/Entregar);
                        // el vendedor lo necesita para cancelar un pedido que el cliente anuló.
                        .requestMatchers(HttpMethod.PUT, "/pedido/*/estado")
                            .hasAnyRole("ADMIN", "PANADERO", "REPARTIDOR", "VENDEDOR")
                        // Cobrar es del que atiende al cliente.
                        .requestMatchers(HttpMethod.PUT, "/pedido/*/pagado").hasAnyRole("ADMIN", "VENDEDOR")
                        // Crear, editar y eliminar pedidos: solo quien los toma.
                        .requestMatchers("/pedido/**").hasAnyRole("ADMIN", "VENDEDOR")

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
        // La autenticación viaja en el header Authorization, no en cookies.
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
