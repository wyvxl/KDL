package org.kits.entities;

import lombok.Data;

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
    private String nombreUsuario;
    /**
     * Contraseña del usuario (generalmente almacenada en formato hash).
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
     * Estado del usuario ("A" para activo, "I" para inactivo).
     */
    private String activo;
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
