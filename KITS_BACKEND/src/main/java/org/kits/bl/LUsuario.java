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
import java.util.Locale;
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

            u.setPermisos(obtenerPermisosPorRol(u.getNombreRol()));

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
     * Busca un usuario activo por id.
     *
     * <p>Lo usa el filtro JWT en cada petición para que un usuario desactivado, o al que
     * le cambiaron el rol, no pueda seguir usando un token emitido antes del cambio.</p>
     *
     * @param idUsuario Id del usuario
     * @return el usuario (con su rol actual), o {@code null} si no existe o está inactivo
     */
    public Usuario ConsultarActivoPorId(int idUsuario) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", idUsuario, Types.NUMERIC));
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_USUARIOS.sp_op_consultar_usuario_id", parameters);
        if (result != null && !result.isEmpty()) {
            return mapRowToUsuario(result.getFirst());
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
        if (usuario.getIdRol() == null) {
            throw new IllegalArgumentException("El rol del usuario es requerido");
        }
        // Al editar, una contraseña nula conserva la actual (NVL en el procedimiento);
        // al crear es obligatoria porque USUARIOS.contrasena es NOT NULL.
        if (usuario.getIdUsuario() == null
                && (usuario.getContrasena() == null || usuario.getContrasena().isBlank())) {
            throw new IllegalArgumentException("La contraseña es requerida para un usuario nuevo");
        }

        var parameters = new ArrayList<Parameter<?>>();
        // p_id nulo le indica al procedimiento que es un alta (INSERT); con un valor
        // hace UPDATE. Por eso el frontend manda null y no 0 para un usuario nuevo.
        parameters.add(new Parameter<>("p_id", usuario.getIdUsuario(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_rol", usuario.getIdRol(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_user", usuario.getNombreUsuario(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_pass", usuario.getContrasena(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_mail", usuario.getEmail(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_nom", usuario.getNombreCompleto(), Types.VARCHAR));
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_USUARIOS.sp_op_gestionar_usuario", parameters);
    }

    /**
     * Cambia la contraseña del propio usuario, verificando primero la actual.
     *
     * <p>Se reutiliza {@link #Autenticar} para comprobarla, de forma que la validación
     * sea exactamente la misma que en el login (incluido que la cuenta siga activa).
     * Como efecto de eso, confirmar la contraseña actual también actualiza
     * {@code ultimo_acceso}: el usuario acaba de acreditar su identidad, así que
     * contarlo como un acceso es razonable.</p>
     *
     * @param nombreUsuario    Usuario que hace el cambio (viene del token, no del cuerpo)
     * @param contrasenaActual Contraseña vigente, para confirmar que es quien dice ser
     * @param nuevaContrasena  Nueva contraseña
     * @return true si la contraseña actual era correcta y se cambió; false en caso contrario
     */
    public boolean CambiarContrasenaPropia(String nombreUsuario, String contrasenaActual, String nuevaContrasena) {
        if (Autenticar(nombreUsuario, contrasenaActual) == null) {
            return false;
        }
        CambiarContrasena(nombreUsuario, nuevaContrasena);
        return true;
    }

    /**
     * Cambia la contraseña de un usuario sin pedir la actual.
     *
     * <p>Es el restablecimiento que hace un administrador. Para que un usuario cambie la
     * suya propia, usar {@link #CambiarContrasenaPropia}.</p>
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
     * Obtiene los permisos de UI según el rol del usuario.
     *
     * <p>Se resuelve por nombre de rol y no por id: los ids de ROLES son
     * {@code GENERATED ALWAYS AS IDENTITY} y se desplazan al recargar la base o al crear
     * roles nuevos. Debe mantenerse alineado con las reglas de
     * {@code SecurityConfig}, que es quien realmente autoriza; esta lista solo decide
     * qué ve el usuario en pantalla.</p>
     *
     * @param nombreRol Nombre del rol (ADMIN, VENDEDOR, PANADERO, REPARTIDOR)
     * @return Lista de códigos de permiso
     */
    private List<String> obtenerPermisosPorRol(String nombreRol) {
        List<String> permisos = new ArrayList<>();
        // Todo usuario autenticado ve su tablero y los pedidos.
        permisos.add("VER_DASHBOARD");
        permisos.add("VER_PEDIDOS");

        String rol = nombreRol == null ? "" : nombreRol.trim().toUpperCase(Locale.ROOT);

        switch (rol) {
            case "ADMIN" -> {
                permisos.add("VER_CLIENTES");
                permisos.add("VER_PRODUCTOS");
                permisos.add("VER_USUARIOS");
                permisos.add("VER_PRODUCCION");
                permisos.add("GESTIONAR_PEDIDOS");
                permisos.add("AVANZAR_PEDIDOS");
                permisos.add("GESTIONAR_PRODUCTOS");
                // Comodín que el frontend interpreta como "puede todo".
                permisos.add("GESTIONAR_TODO");
            }
            // Toma los pedidos por teléfono/redes: necesita clientes y catálogo.
            case "VENDEDOR" -> {
                permisos.add("VER_CLIENTES");
                permisos.add("VER_PRODUCTOS");
                permisos.add("GESTIONAR_PEDIDOS");
            }
            // Cocina: alista pedidos y repone inventario, no los crea.
            case "PANADERO" -> {
                permisos.add("VER_PRODUCTOS");
                permisos.add("VER_PRODUCCION");
                permisos.add("AVANZAR_PEDIDOS");
                permisos.add("GESTIONAR_PRODUCTOS");
            }
            // Reparto: solo consulta pedidos y los avanza hasta entregado.
            case "REPARTIDOR" -> permisos.add("AVANZAR_PEDIDOS");
            default -> {
                // Rol desconocido (creado desde POST /rol): sin permisos adicionales.
            }
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
        u.setUltimoAcceso(toDate(row.get("ultimo_acceso")));
        return u;
    }
}
