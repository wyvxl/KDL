package org.kits.entities;

import lombok.Data;

/**
 * Representa un Rol en el sistema.
 * Define los permisos y accesos que tiene un usuario.
 */
@Data
public class Rol {
    /**
     * Identificador único del rol.
     */
    private Integer idRol;
    /**
     * Nombre del rol (ej. "Administrador", "Panadero").
     */
    private String nombreRol;
    /**
     * Descripción de las responsabilidades del rol.
     */
    private String descripcion;
    /**
     * Estado del rol ('S' para activo, 'N' para inactivo).
     */
    private String activo;

    /**
     * Constructor por defecto.
     */
    public Rol() {
    }

    /**
     * Constructor con todos los campos.
     * 
     * @param idRol       ID del rol.
     * @param nombreRol   Nombre del rol.
     * @param descripcion Descripción del rol.
     */
    public Rol(Integer idRol, String nombreRol, String descripcion) {
        this();
        this.idRol = idRol;
        this.nombreRol = nombreRol;
        this.descripcion = descripcion;
    }

    public String getNombre() {
        return nombreRol;
    }

    public void setNombre(String nombre) {
        this.nombreRol = nombre;
    }
}
