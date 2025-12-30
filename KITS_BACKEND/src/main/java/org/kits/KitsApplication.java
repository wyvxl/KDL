package org.kits;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Clase principal de la aplicación Kits Backend.
 * Sistema de gestión para pedidos, productos, clientes y usuarios.
 * 
 * @author Leandro Lizano
 * @version 1.0
 */
@SpringBootApplication
public class KitsApplication {

    /**
     * Método principal que inicia la aplicación Spring Boot.
     * 
     * @param args Argumentos de línea de comandos
     */
    public static void main(String[] args) {
        SpringApplication.run(KitsApplication.class, args);
    }

}
