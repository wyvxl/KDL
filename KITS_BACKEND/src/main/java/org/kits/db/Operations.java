package org.kits.db;

import org.kits.dto.Parameter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Component
public class Operations {
    private final ConnectionManager connection;

    public ConnectionManager getConnection() {
        return connection;
    }

    @Autowired
    public Operations(ConnectionManager connection) {
        this.connection = connection;
        if (!this.connection.Connect()) {
            throw new RuntimeException("Failed to connect to the database. Check the database configuration and connectivity.");
        }
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
            return this.connection.Execute(command, parameters);
        } catch (SQLException e) {
            Logger.getLogger(Operations.class.getName())
                    .severe("Error crítico al ejecutar la sentencia con resultado entero: " + e.getMessage());
            throw new RuntimeException("Error en operación de base de datos: " + e.getMessage(), e);
        }
    }
}
