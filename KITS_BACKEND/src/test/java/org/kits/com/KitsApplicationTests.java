package org.kits.com;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// Sin la verificación de conexión al arrancar, el contexto levanta sin Oracle:
// Hikari no abre conexiones hasta la primera consulta.
@SpringBootTest(properties = "app.db.verificar-al-iniciar=false")
class KitsApplicationTests {

    @Test
    void contextLoads() {
    }

}
