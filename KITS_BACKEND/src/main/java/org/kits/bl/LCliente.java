package org.kits.bl;

import org.kits.db.ConnectionManager;
import org.kits.db.Operations;
import org.kits.dto.Parameter;
import org.kits.entities.Cliente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Clase de lógica de negocio para gestión de Clientes.
 * Proporciona operaciones CRUD para la entidad Cliente.
 */
@Component
public class LCliente extends Operations {

    @Autowired
    public LCliente(ConnectionManager connectionManager) {
        super(connectionManager);
    }

    /**
     * Lista todos los clientes activos del sistema.
     * 
     * @return Lista de clientes con información completa
     */
    public ArrayList<Cliente> Listar() {
        var clientes = new ArrayList<Cliente>();
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_CLIENTES.sp_op_listar_clientes", parameters);
        if (result != null) {
            for (Map<String, Object> row : result) {
                Cliente c = new Cliente();
                c.setIdCliente(((BigDecimal) row.get("id_cliente")).intValue());
                c.setNombre((String) row.get("nombre"));
                c.setTelefono((String) row.get("telefono"));
                c.setDireccion((String) row.get("direccion"));
                c.setEmail((String) row.get("email"));
                c.setNotas((String) row.get("notas"));
                c.setActivo((String) row.get("activo"));
                c.setFechaRegistro(row.get("fecha_registro").toString());
                clientes.add(c);
            }
        }
        return clientes;
    }

    /**
     * Consulta un cliente específico por su ID.
     * 
     * @param idCliente ID del cliente a consultar
     * @return Cliente encontrado o lanza excepción si no existe
     */
    public Cliente Consultar(int idCliente) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", idCliente, Types.NUMERIC));
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_CLIENTES.sp_op_consultar_cliente", parameters);
        if (result != null && !result.isEmpty()) {
            Map<String, Object> row = result.getFirst();
            Cliente c = new Cliente();
            c.setIdCliente(((BigDecimal) row.get("id_cliente")).intValue());
            c.setNombre((String) row.get("nombre"));
            c.setTelefono((String) row.get("telefono"));
            c.setDireccion((String) row.get("direccion"));
            c.setEmail((String) row.get("email"));
            c.setNotas((String) row.get("notas"));
            c.setActivo((String) row.get("activo"));
            c.setFechaRegistro(row.get("fecha_registro").toString());
            return c;
        }
        throw new RuntimeException("Cliente no encontrado: " + idCliente);
    }

    /**
     * Crea un nuevo cliente o actualiza uno existente.
     * 
     * @param cliente Datos del cliente a guardar
     * @return ID del cliente creado/actualizado
     */
    public int Guardar(Cliente cliente) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", cliente.getIdCliente(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_nom", cliente.getNombre(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_tel", cliente.getTelefono(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_dir", cliente.getDireccion(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_mail", cliente.getEmail(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_notas", cliente.getNotas(), Types.VARCHAR));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_CLIENTES.sp_op_gestionar_cliente", parameters);
    }
}
