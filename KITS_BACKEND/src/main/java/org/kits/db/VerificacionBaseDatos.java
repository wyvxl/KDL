package org.kits.db;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Falla el arranque si no hay conexión con Oracle, en vez de levantar una API que
 * responde 500 en todo.
 *
 * <p>Se puede apagar con {@code app.db.verificar-al-iniciar=false}; las pruebas lo hacen
 * para poder levantar el contexto sin una base de datos.</p>
 */
@Component
@ConditionalOnProperty(name = "app.db.verificar-al-iniciar", havingValue = "true", matchIfMissing = true)
public class VerificacionBaseDatos implements ApplicationRunner {

    private final ConnectionManager connection;

    public VerificacionBaseDatos(ConnectionManager connection) {
        this.connection = connection;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!connection.Connect()) {
            throw new IllegalStateException(
                    "No se pudo conectar a la base de datos. Revise la configuración y que Oracle esté levantado.");
        }
    }
}
