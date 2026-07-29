package org.kits.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Date;
import java.util.List;

/**
 * Representa a un usuario del sistema.
 * Contiene credenciales, información personal y el rol asociado.
 */
@Data
public class Usuario {
    /**
     * Identificador único del usuario.
     */
    private Integer idUsuario;
    /**
     * Nombre de usuario para el inicio de sesión.
     */
    @NotBlank(message = "El nombre de usuario es requerido")
    private String nombreUsuario;
    /**
     * Contraseña del usuario. Nota: en este proyecto (académico) se almacena en texto plano.
     */
    private String contrasena;
    /**
     * Correo electrónico del usuario.
     */
    private String email;
    /**
     * Nombre completo del usuario.
     */
    private String nombreCompleto;
    /**
     * Estado del usuario ("S" para activo, "N" para inactivo).
     */
    private String activo;
    /**
     * Fecha y hora del último inicio de sesión correcto.
     * La registra {@code sp_autenticar_usuario}; es null si el usuario nunca ha entrado.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Date ultimoAcceso;
    /**
     * Rol asignado al usuario, que define sus permisos.
     */
    private Rol rol;
    /**
     * Lista de permisos específicos asignados al usuario.
     * Esta lista se calcula en la lógica de negocio al autenticar.
     */
    private List<String> permisos;

    /**
     * Constructor por defecto.
     */
    public Usuario() {
        super();
    }

    /**
     * Constructor con campos esenciales para crear un usuario.
     * 
     * @param idUsuario      ID del usuario.
     * @param nombreCompleto Nombre completo.
     * @param nombreUsuario  Nombre para el login.
     * @param email          Correo electrónico.
     * @param rol            Rol del usuario.
     */
    public Usuario(Integer idUsuario, String nombreCompleto, String nombreUsuario, String email, Rol rol) {
        this();
        this.idUsuario = idUsuario;
        this.nombreCompleto = nombreCompleto;
        this.nombreUsuario = nombreUsuario;
        this.email = email;
        this.rol = rol;
    }

    public Integer getIdRol() {
        return rol != null ? rol.getIdRol() : null;
    }

    // Setter para idRol que crea un objeto Rol si es necesario
    public void setIdRol(Integer idRol) {
        if (this.rol == null) {
            this.rol = new Rol();
        }
        this.rol.setIdRol(idRol);
    }

    public String getNombreRol() {
        return rol != null ? rol.getNombre() : null;
    }
}
