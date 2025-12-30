package org.kits.bl;

import org.kits.db.ConnectionManager;
import org.kits.db.Operations;
import org.kits.dto.Parameter;
import org.kits.entities.Rol;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Clase de lógica de negocio para gestión de Roles.
 */
@Component
public class LRol extends Operations {

    @Autowired
    public LRol(ConnectionManager connectionManager) {
        super(connectionManager);
    }

    /**
     * Lista todos los roles disponibles.
     * 
     * @return Lista de roles
     */
    public ArrayList<Rol> Listar() {
        var roles = new ArrayList<Rol>();
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_ROLES.sp_op_listar_roles", parameters);
        if (result != null) {
            for (Map<String, Object> row : result) {
                Rol r = new Rol();
                r.setIdRol(((BigDecimal) row.get("id_rol")).intValue());
                r.setNombreRol((String) row.get("nombre_rol"));
                r.setDescripcion((String) row.get("descripcion"));
                roles.add(r);
            }
        }
        return roles;
    }

    /**
     * Crea un nuevo rol.
     * @param rol Datos del rol a crear
     * @return ID del rol creado
     */
    public int Guardar(Rol rol) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_nombre_rol", rol.getNombreRol(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_descripcion", rol.getDescripcion(), Types.VARCHAR));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_ROLES.sp_op_crear_rol", parameters);
    }
}
