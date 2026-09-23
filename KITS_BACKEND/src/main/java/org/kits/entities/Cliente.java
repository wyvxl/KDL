package org.kits.entities;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(max = 150, message = "El nombre admite hasta 150 caracteres")
    private String nombre;
    /**
     * Número de teléfono de contacto. Obligatorio: CLIENTES.telefono es NOT NULL y es
     * como la panadería confirma los pedidos.
     */
    @NotBlank(message = "El teléfono del cliente es requerido")
    @Size(max = 20, message = "El teléfono admite hasta 20 caracteres")
    private String telefono;
    /**
     * Dirección de domicilio o entrega.
     */
    @Size(max = 300, message = "La dirección admite hasta 300 caracteres")
    private String direccion;
    /**
     * Correo electrónico del cliente.
     */
    @Email(message = "El email del cliente no es válido")
    @Size(max = 100, message = "El email admite hasta 100 caracteres")
    private String email;
    /**
     * Campo para anotaciones o información adicional sobre el cliente.
     */
    @Size(max = 500, message = "Las notas admiten hasta 500 caracteres")
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
