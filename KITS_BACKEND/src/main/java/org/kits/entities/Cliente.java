package org.kits.entities;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Representa a un cliente en el sistema.
 * Contiene información de contacto y datos personales.
 */
@Data
public class Cliente {
    /**
     * Identificador único del cliente.
     */
    private Integer idCliente;
    /**
     * Nombre completo del cliente.
     */
    @NotBlank(message = "El nombre del cliente es requerido")
    private String nombre;
    /**
     * Número de teléfono de contacto.
     */
    private String telefono;
    /**
     * Dirección de domicilio o entrega.
     */
    private String direccion;
    /**
     * Correo electrónico del cliente.
     */
    private String email;
    /**
     * Campo para anotaciones o información adicional sobre el cliente.
     */
    private String notas;
    /**
     * Estado del cliente en el sistema ("S" para activo, "N" para dado de baja).
     */
    private String activo;
    /**
     * Fecha en que el cliente fue registrado.
     */
    private String fechaRegistro;

    /**
     * Constructor por defecto.
     */
    public Cliente() {
        super();
    }

    /**
     * Constructor con campos esenciales para crear un cliente.
     * @param idCliente ID del cliente.
     * @param nombre Nombre del cliente.
     * @param telefono Teléfono de contacto.
     * @param direccion Dirección del cliente.
     * @param email Correo electrónico.
     */
    public Cliente(Integer idCliente, String nombre, String telefono, String direccion, String email) {
        this();
        this.idCliente = idCliente;
        this.nombre = nombre;
        this.telefono = telefono;
        this.direccion = direccion;
        this.email = email;
    }
}
