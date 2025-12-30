package org.kits.dto;

/**
 * Clase genérica para manejo de parámetros en procedimientos almacenados.
 * Encapsula la información necesaria para ejecutar stored procedures
 * con diferentes tipos de datos y parámetros de entrada/salida.
 * 
 * @param <T> Tipo de dato del valor del parámetro
 */
public class Parameter<T> {
    /** Nombre del parámetro en el procedimiento almacenado */
    private String nombre;
    
    /** Nombre del tipo de dato (para tipos complejos) */
    private String nombreTipo;
    
    /** Nombre específico del tipo (para arrays y objetos Oracle) */
    private String nombreTipoEspecifico;
    
    /** Valor del parámetro */
    private Object valor;
    
    /** Tipo SQL según java.sql.Types */
    private int tipoSQL;
    
    /** Indica si es un parámetro de salida */
    private boolean respuesta;

    // Getters y Setters
    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getNombreTipo() {
        return nombreTipo;
    }

    public void setNombreTipo(String nombreTipo) {
        this.nombreTipo = nombreTipo;
    }

    public String getNombreTipoEspecifico() {
        return nombreTipoEspecifico;
    }

    public void setNombreTipoEspecifico(String nombreTipoEspecifico) {
        this.nombreTipoEspecifico = nombreTipoEspecifico;
    }

    public Object getValor() {
        return valor;
    }

    public void setValor(Object valor) {
        this.valor = valor;
    }

    public int getTipoSQL() {
        return tipoSQL;
    }

    public void setTipoSQL(int tipoSQL) {
        this.tipoSQL = tipoSQL;
    }

    public boolean isRespuesta() {
        return respuesta;
    }

    public void setRespuesta(boolean respuesta) {
        this.respuesta = respuesta;
    }

    /**
     * Constructor básico para parámetros de entrada.
     * 
     * @param nombre Nombre del parámetro
     * @param valor Valor del parámetro
     * @param tipoSQL Tipo SQL según java.sql.Types
     */
    public Parameter(String nombre, T valor, int tipoSQL) {
        this.nombre = nombre;
        this.valor = valor;
        this.tipoSQL = tipoSQL;
    }

    /**
     * Constructor para parámetros de entrada/salida.
     * 
     * @param nombre Nombre del parámetro
     * @param valor Valor del parámetro
     * @param tipoSQL Tipo SQL según java.sql.Types
     * @param respuesta true si es parámetro de salida
     */
    public Parameter(String nombre, T valor, int tipoSQL, boolean respuesta) {
        this.nombre = nombre;
        this.valor = valor;
        this.tipoSQL = tipoSQL;
        this.respuesta = respuesta;
    }

    /**
     * Constructor completo para tipos complejos.
     * 
     * @param nombre Nombre del parámetro
     * @param valor Valor del parámetro
     * @param tipoSQL Tipo SQL según java.sql.Types
     * @param nombreTipo Nombre del tipo de dato
     * @param nombreTipoEspecifico Nombre específico del tipo
     * @param respuesta true si es parámetro de salida
     */
    public Parameter(String nombre, T valor, int tipoSQL, String nombreTipo, String nombreTipoEspecifico, boolean respuesta) {
        this.nombre = nombre;
        this.valor = valor;
        this.tipoSQL = tipoSQL;
        this.nombreTipo = nombreTipo;
        this.nombreTipoEspecifico = nombreTipoEspecifico;
        this.respuesta = respuesta;
    }

    /**
     * Constructor específico para arrays Oracle.
     * Utilizado para pasar colecciones de datos a procedimientos almacenados.
     * 
     * @param nombre Nombre del parámetro
     * @param nombreTipo Nombre del tipo Oracle (ej: T_LISTA_DETALLES)
     * @param nombreTipoEspecifico Tipo específico del elemento (ej: T_DETALLE_PEDIDO)
     * @param valor Array de valores
     * @param tipoSQL Tipo SQL (Types.ARRAY)
     */
    public Parameter(String nombre, String nombreTipo, String nombreTipoEspecifico, Object valor, int tipoSQL) {
        this.nombre = nombre;
        this.nombreTipo = nombreTipo;
        this.nombreTipoEspecifico = nombreTipoEspecifico;
        this.valor = valor;
        this.tipoSQL = tipoSQL;
        this.respuesta = false;
    }
}