package org.kits.db;

import org.kits.dto.Parameter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Component
public class Operations {
    private final ConnectionManager connection;

    public ConnectionManager getConnection() {
        return connection;
    }

    // La comprobación de conectividad al arrancar vive en VerificacionBaseDatos: aquí se
    // repetía una vez por cada clase de lógica y no se podía desactivar en las pruebas.
    @Autowired
    public Operations(ConnectionManager connection) {
        this.connection = connection;
    }

    // Métodos protegidos.
    protected boolean isConnected() {
        return this.connection.isConnected();
    }

    protected Parameter<?> createResponseParameter() {
        return new Parameter<>("p_res", null, Types.REF_CURSOR, true);
    }

    protected Parameter<?> createIntegerResponseParameter() {
        return new Parameter<>("p_res", null, Types.INTEGER, true);
    }

    // Retorno de datos.
    protected List<Map<String, Object>> executeQuery(String command, ArrayList<Parameter<?>> parameters) {
        try {
            return this.connection.Execute(command, parameters);
        } catch (SQLException e) {
            Logger.getLogger(Operations.class.getName()).severe("Error crítico al ejecutar consulta: " + e.getMessage());
            throw new RuntimeException("Error en consulta de base de datos: " + e.getMessage(), e);
        }
    }

    protected void execute(String command, ArrayList<Parameter<?>> parameters) {
        try {
            this.connection.Execute(command, parameters);
        } catch (SQLException e) {
            Logger.getLogger(Operations.class.getName()).severe("Error crítico al ejecutar comando: " + e.getMessage());
            throw new RuntimeException("Error en comando de base de datos: " + e.getMessage(), e);
        }
    }

    protected int executeWithIntResult(String command, ArrayList<Parameter<?>> parameters) {
        try {
            // El driver devuelve el OUT param como Number (Integer o BigDecimal según el
            // tipo Oracle), y puede venir null si el procedimiento no llegó a asignarlo.
            Object resultado = this.connection.Execute(command, parameters);
            return resultado instanceof Number numero ? numero.intValue() : 0;
        } catch (SQLException e) {
            Logger.getLogger(Operations.class.getName())
                    .severe("Error crítico al ejecutar la sentencia con resultado entero: " + e.getMessage());
            throw new RuntimeException("Error en operación de base de datos: " + e.getMessage(), e);
        }
    }

    /** Convierte a Integer un valor numérico de un cursor (Oracle devuelve BigDecimal). */
    protected static Integer toInt(Object valor) {
        return valor instanceof Number numero ? numero.intValue() : null;
    }

    /** Convierte a Double un valor numérico de un cursor (Oracle devuelve BigDecimal). */
    protected static Double toDouble(Object valor) {
        return valor instanceof Number numero ? numero.doubleValue() : null;
    }

    /**
     * Convierte un valor de fecha de un cursor a {@link java.util.Date}.
     *
     * <p>Contempla los tipos estándar de {@code java.sql} ({@link Timestamp},
     * {@link java.sql.Date}), los de {@code java.time} ({@link LocalDateTime},
     * {@link LocalDate}) y, como último recurso, el parseo de su representación en
     * texto: algunos tipos propietarios de Oracle no se mapean directamente a ninguno
     * de los anteriores.</p>
     *
     * @return la fecha convertida, o {@code null} si el valor es nulo o no se pudo interpretar.
     */
    protected static Date toDate(Object valor) {
        if (valor == null) {
            return null;
        }

        switch (valor) {
            case Timestamp ts:
                return new Date(ts.getTime());
            case java.sql.Date sqlDate:
                return new Date(sqlDate.getTime());
            case LocalDateTime ldt:
                return Date.from(ldt.atZone(ZoneId.systemDefault()).toInstant());
            case LocalDate ld:
                return Date.from(ld.atStartOfDay(ZoneId.systemDefault()).toInstant());
            default:
                String texto = valor.toString();
                try {
                    // Timestamp.valueOf maneja "YYYY-MM-DD HH:MI:SS.F"
                    return Timestamp.valueOf(texto);
                } catch (IllegalArgumentException e) {
                    try {
                        if (texto.length() >= 19) { // al menos hasta los segundos
                            return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(texto.substring(0, 19));
                        }
                    } catch (ParseException parseEx) {
                        Logger.getLogger(Operations.class.getName()).warning(
                                "No se pudo convertir a fecha: " + valor + " (tipo " + valor.getClass().getName() + ")");
                    }
                }
                return null;
        }
    }
}
