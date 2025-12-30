package org.kits.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración web para la aplicación.
 * Define políticas CORS para permitir comunicación con el frontend.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Configura las políticas CORS para permitir peticiones desde el frontend.
     * Permite comunicación con React en desarrollo (puerto 5173).
     * 
     * @param registry Registro de configuraciones CORS
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173") // Frontend React en desarrollo
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization")
                .allowCredentials(true); // Permite cookies y credenciales
    }
}
