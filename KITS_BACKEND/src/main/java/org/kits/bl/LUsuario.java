package org.kits.bl;

import org.kits.db.ConnectionManager;
import org.kits.db.Operations;
import org.kits.dto.Parameter;
import org.kits.entities.Rol;
import org.kits.entities.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Clase de lógica de negocio para gestión de Usuarios.
 */
@Component
public class LUsuario extends Operations {

    @Autowired
    public LUsuario(ConnectionManager connectionManager) {
        super(connectionManager);
    }

    /**
     * Autentica un usuario con nombre de usuario y contraseña.
     *
     * @param usuario  Nombre de usuario
     * @param password Contraseña
     * @return Usuario autenticado o null si credenciales inválidas
     */
    public Usuario Autenticar(String usuario, String password) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_user", usuario, Types.VARCHAR));
        parameters.add(new Parameter<>("p_pass", password, Types.VARCHAR));
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_USUARIOS.sp_op_autenticar", parameters);
        if (result != null && !result.isEmpty()) {
            Map<String, Object> row = result.getFirst();
            Usuario u = mapRowToUsuario(row);

            u.setPermisos(obtenerPermisosPorRol(u.getRol().getIdRol()));

            return u;
        }
        return null;
    }



    /**
     * Busca un usuario por nombre de usuario.
     *
     * @param nombreUsuario Nombre de usuario a buscar
     * @return Usuario encontrado o null
     */
    public Usuario Consultar(String nombreUsuario) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_user", nombreUsuario, Types.VARCHAR));
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_USUARIOS.sp_op_buscar_usuario", parameters);
        if (result != null && !result.isEmpty()) {
            Map<String, Object> row = result.getFirst();
            Usuario u = mapRowToUsuario(row);
            u.setContrasena((String) row.get("contrasena"));
            return u;
        }
        return null;
    }

    /**
     * Lista todos los usuarios.
     *
     * @return Lista de usuarios
     */
    public ArrayList<Usuario> Listar() {
        var usuarios = new ArrayList<Usuario>();
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_USUARIOS.sp_op_listar_usuarios", parameters);
        if (result != null) {
            for (Map<String, Object> row : result) {
                usuarios.add(mapRowToUsuario(row));
            }
        }
        return usuarios;
    }

    /**
     * Crea o actualiza un usuario.
     *
     * @param usuario Datos del usuario
     * @return ID del usuario creado/actualizado
     */
    public int Guardar(Usuario usuario) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", usuario.getIdUsuario(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_rol", usuario.getRol().getIdRol(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_user", usuario.getNombreUsuario(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_pass", usuario.getContrasena(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_mail", usuario.getEmail(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_nom", usuario.getNombreCompleto(), Types.VARCHAR));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_USUARIOS.sp_op_gestionar_usuario", parameters);
    }

    /**
     * Cambia la contraseña de un usuario.
     *
     * @param nombreUsuario   Usuario al que cambiar contraseña
     * @param nuevaContrasena Nueva contraseña
     */
    public void CambiarContrasena(String nombreUsuario, String nuevaContrasena) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_user", nombreUsuario, Types.VARCHAR));
        parameters.add(new Parameter<>("p_new_pass", nuevaContrasena, Types.VARCHAR));

        execute("PKG_USUARIOS.sp_op_cambiar_contrasena", parameters);
    }

    /**
     * Elimina (desactiva) un usuario.
     *
     * @param id ID del usuario
     * @return Número de filas afectadas
     */
    public int Eliminar(int id) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", id, Types.NUMERIC));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_USUARIOS.sp_op_eliminar_usuario", parameters);
    }

    /**
     * Activa un usuario previamente desactivado.
     *
     * @param id ID del usuario
     * @return Número de filas afectadas
     */
    public int Activar(int id) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", id, Types.NUMERIC));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_USUARIOS.sp_op_activar_usuario", parameters);
    }

    /**
     * Obtiene los permisos según el rol del usuario.
     * 
     * @param idRol ID del rol (1: Admin, 2: Repartidor, 3: Panadero, 4: Pruebas)
     * @return Lista de permisos
     */
    private List<String> obtenerPermisosPorRol(int idRol) {
        List<String> permisos = new ArrayList<>();
        permisos.add("VER_DASHBOARD");
        
        if (idRol == 1 || idRol == 4) { // Admins
            permisos.add("VER_PRODUCTOS");
            permisos.add("VER_CLIENTES");
            permisos.add("VER_PEDIDOS");
            permisos.add("VER_USUARIOS");
            permisos.add("GESTIONAR_TODO");
        } else if (idRol == 2) { // Repartidor
            permisos.add("VER_PEDIDOS");
        } else if (idRol == 3) { // Panadero
            permisos.add("VER_PEDIDOS");
            permisos.add("VER_PRODUCTOS");
        }
        
        return permisos;
    }

    /**
     * Mapea una fila de resultado a un objeto Usuario.
     */
    private Usuario mapRowToUsuario(Map<String, Object> row) {
        Usuario u = new Usuario();
        if (row.get("id_usuario") != null) {
            u.setIdUsuario(((BigDecimal) row.get("id_usuario")).intValue());
        }

        Rol rol = new Rol();
        if (row.get("id_rol") != null) {
            rol.setIdRol(((BigDecimal) row.get("id_rol")).intValue());
        }
        if (row.containsKey("nombre_rol")) {
            rol.setNombreRol((String) row.get("nombre_rol"));
        }
        u.setRol(rol);

        u.setNombreUsuario((String) row.get("nombre_usuario"));
        u.setEmail((String) row.get("email"));
        u.setNombreCompleto((String) row.get("nombre_completo"));
        u.setActivo((String) row.get("activo"));
        return u;
    }
}
