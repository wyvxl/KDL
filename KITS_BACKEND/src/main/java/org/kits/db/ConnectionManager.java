package org.kits.db;

import oracle.jdbc.OracleConnection;
import org.kits.dto.Parameter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Componente que gestiona las conexiones y ejecuciones en base de datos Oracle.
 * Encapsula la lógica de comunicación JDBC y manejo de parámetros/cursores.
 */
@Component
public class ConnectionManager implements IConnectionManager {

    private final DataSource dataSource;

    @Autowired
    public ConnectionManager(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Verifica si se puede obtener una conexión válida.
     *
     * @return true si la conexión es exitosa, false en caso contrario
     */
    @Override
    public boolean Connect() {
        try (Connection connection = dataSource.getConnection()) {
            return !connection.isClosed();
        } catch (Exception e) {
            Logger.getLogger(ConnectionManager.class.getName())
                    .severe("Error al conectar a la base de datos: " + e.getMessage());
            return false;
        }
    }

    /**
     * Simula la desconexión (manejada por el pool).
     *
     * @return true siempre
     */
    @Override
    public boolean Disconnect() {
        // El pool de conexiones gestiona las conexiones automáticamente.
        return true;
    }

    /**
     * Ejecuta un procedimiento almacenado en la base de datos.
     * Soporta parámetros de entrada, salida, cursores y arrays.
     *
     * @param command    Nombre del procedimiento (paquete.procedimiento)
     * @param parameters Lista de parámetros configurados
     * @return Resultado de la ejecución (lista de mapas para cursores, objeto para
     *         otros tipos, o null)
     * @throws SQLException si ocurre un error en la base de datos
     */
    @SuppressWarnings("unchecked")
    @Override
    public <T> T Execute(String command, ArrayList<Parameter<?>> parameters) throws SQLException {
        if (command == null || command.trim().isEmpty()) {
            throw new IllegalArgumentException("Command cannot be null or empty");
        }
        // Validar que el comando solo contenga caracteres seguros para procedimientos
        if (!command.matches("^[a-zA-Z_][a-zA-Z0-9_.]*$")) {
            throw new IllegalArgumentException("Invalid procedure name format: " + command);
        }

        StringBuilder callString = new StringBuilder("{call ");
        callString.append(command);
        if (parameters != null && !parameters.isEmpty()) {
            callString.append("(");
            for (int i = 0; i < parameters.size(); i++) {
                callString.append(i == 0 ? "?" : ",?");
            }
            callString.append(")");
        }
        callString.append("}");

        try (Connection connection = dataSource.getConnection()) {
            // Desenvuelve la conexión para obtener la OracleConnection nativa
            OracleConnection myConnection = connection.unwrap(OracleConnection.class);

            try (CallableStatement statement = myConnection.prepareCall(callString.toString())) {
                Integer responseIndex = null;
                int responseType = -1;

                if (parameters != null) {
                    for (int i = 0; i < parameters.size(); i++) {
                        Parameter<?> param = parameters.get(i);
                        int index = i + 1;

                        if (!param.isRespuesta()) {
                            if (param.getTipoSQL() == Types.ARRAY) {
                                if (param.getValor() instanceof ArrayList<?> arrayList) {
                                    List<Struct> values = new ArrayList<>();
                                    for (Object value : arrayList) {
                                        if (value instanceof Object[] objArray) {
                                            values.add(myConnection.createStruct(param.getNombreTipoEspecifico(),
                                                    objArray));
                                        }
                                    }
                                    statement.setArray(index,
                                            myConnection.createOracleArray(param.getNombreTipo(), values.toArray()));
                                }
                            } else {
                                if (param.getValor() == null) {
                                    statement.setNull(index, param.getTipoSQL());
                                } else {
                                    statement.setObject(index, param.getValor(), param.getTipoSQL());
                                }
                            }
                        } else {
                            statement.registerOutParameter(index, param.getTipoSQL());
                            responseIndex = index;
                            responseType = param.getTipoSQL();
                        }
                    }
                }

                statement.execute();

                if (responseIndex == null) {
                    // No hay parámetro de salida, es una llamada "fire-and-forget".
                    return null;
                }

                // Si la respuesta es un cursor, procesarlo aquí mismo.
                if (responseType == Types.REF_CURSOR) {
                    Object resultObj = statement.getObject(responseIndex);
                    if (resultObj instanceof ResultSet rs) {
                        try (rs) {
                            List<Map<String, Object>> resultList = new ArrayList<>();
                            ResultSetMetaData md = rs.getMetaData();
                            int columns = md.getColumnCount();
                            while (rs.next()) {
                                Map<String, Object> row = new HashMap<>(columns);
                                for (int i = 1; i <= columns; ++i) {
                                    row.put(md.getColumnLabel(i).toLowerCase(java.util.Locale.ROOT), rs.getObject(i));
                                }
                                resultList.add(row);
                            }
                            return (T) resultList;
                        }
                    }
                    return null;
                } else {
                    // Comportamiento original para otros tipos (ej. INTEGER).
                    Object result = statement.getObject(responseIndex);
                    return (T) result;
                }
            }
        }
    }

    /**
     * Verifica el estado de la conexión actual.
     *
     * @return true si hay conexión activa
     */
    public boolean isConnected() {
        try (Connection connection = dataSource.getConnection()) {
            return !connection.isClosed();
        } catch (Exception e) {
            Logger.getLogger(ConnectionManager.class.getName())
                    .warning("Error al detectar la conexión: " + e.getMessage());
            return false;
        }
    }
}
