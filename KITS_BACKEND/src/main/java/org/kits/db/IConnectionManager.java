package org.kits.db;

import org.kits.dto.Parameter;

import java.sql.SQLException;
import java.util.ArrayList;

public interface IConnectionManager {
    boolean Connect();

    <T> T Execute(String command, ArrayList<Parameter<?>> parameters) throws SQLException;
}
