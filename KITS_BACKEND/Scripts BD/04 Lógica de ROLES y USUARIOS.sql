-- SCRIPT 04: LÓGICA DE ROLES Y USUARIOS SPs


-- Crear Rol
CREATE OR REPLACE PROCEDURE sp_crear_rol (
    p_nombre_rol  IN ROLES.NOMBRE_ROL%TYPE,
    p_descripcion IN ROLES.DESCRIPCION%TYPE,
    p_id_resultado OUT ROLES.ID_ROL%TYPE
) AS
BEGIN
    INSERT INTO ROLES (nombre_rol, descripcion) VALUES (p_nombre_rol, p_descripcion)
    RETURNING id_rol INTO p_id_resultado;
    COMMIT;
EXCEPTION WHEN OTHERS THEN ROLLBACK; RAISE;
END;
/

-- Listar Roles
CREATE OR REPLACE PROCEDURE sp_listar_roles (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_rol, nombre_rol, descripcion, activo, fecha_creacion
        FROM ROLES
        WHERE activo = 'S'
        ORDER BY nombre_rol;
END;
/

-- Gestionar Usuario
CREATE OR REPLACE PROCEDURE sp_gestionar_usuario (
    p_id_usuario      IN USUARIOS.ID_USUARIO%TYPE,
    p_id_rol          IN USUARIOS.ID_ROL%TYPE,
    p_nombre_usuario  IN USUARIOS.NOMBRE_USUARIO%TYPE,
    p_contrasena      IN USUARIOS.CONTRASENA%TYPE,
    p_email           IN USUARIOS.EMAIL%TYPE,
    p_nombre_completo IN USUARIOS.NOMBRE_COMPLETO%TYPE,
    p_id_resultado    OUT USUARIOS.ID_USUARIO%TYPE
) AS
BEGIN
    IF p_id_usuario IS NULL THEN
        -- Si el ID es nulo, es una INSERCIÓN
        INSERT INTO USUARIOS (id_rol, nombre_usuario, contrasena, email, nombre_completo)
        VALUES (p_id_rol, p_nombre_usuario, p_contrasena, p_email, p_nombre_completo)
        RETURNING id_usuario INTO p_id_resultado;
    ELSE
        -- Si el ID existe, es una ACTUALIZACIÓN
        UPDATE USUARIOS 
        SET id_rol = p_id_rol, 
            nombre_usuario = p_nombre_usuario, 
            contrasena = NVL(p_contrasena, contrasena), 
            email = p_email, 
            nombre_completo = p_nombre_completo
        WHERE id_usuario = p_id_usuario;
        
        p_id_resultado := p_id_usuario;
    END IF;
    COMMIT;
EXCEPTION WHEN OTHERS THEN ROLLBACK; RAISE;
END;
/

-- Autenticar Usuario
--
-- Además de validar las credenciales, deja registrado el acceso en ultimo_acceso.
-- Tiene que hacerse aquí y no en un trigger: autenticarse es un SELECT, así que un
-- trigger de UPDATE nunca se enteraba de los logins (y en cambio se disparaba con
-- cualquier edición del usuario, que no es un acceso).
CREATE OR REPLACE PROCEDURE sp_autenticar_usuario (
    p_nombre_usuario IN USUARIOS.NOMBRE_USUARIO%TYPE,
    p_contrasena     IN USUARIOS.CONTRASENA%TYPE,
    p_cursor         OUT SYS_REFCURSOR
) AS
    v_id_usuario USUARIOS.ID_USUARIO%TYPE;
BEGIN
    BEGIN
        SELECT id_usuario INTO v_id_usuario
        FROM USUARIOS
        WHERE nombre_usuario = p_nombre_usuario
          AND contrasena = p_contrasena
          AND activo = 'S';

        UPDATE USUARIOS
        SET ultimo_acceso = CURRENT_TIMESTAMP
        WHERE id_usuario = v_id_usuario;

        COMMIT;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- Credenciales inválidas o cuenta desactivada: no se registra ningún acceso
            -- y el cursor sale vacío, que es como el backend detecta el fallo de login.
            v_id_usuario := NULL;
    END;

    OPEN p_cursor FOR
        SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.nombre_usuario,
               u.contrasena, u.email, u.nombre_completo, u.activo,
               u.fecha_creacion, u.ultimo_acceso
        FROM USUARIOS u
        INNER JOIN ROLES r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = v_id_usuario;
END;
/

-- Buscar Usuario por Nombre
CREATE OR REPLACE PROCEDURE sp_buscar_usuario (
    p_nombre_usuario IN USUARIOS.NOMBRE_USUARIO%TYPE,
    p_cursor         OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.nombre_usuario, 
               u.contrasena, u.email, u.nombre_completo, u.activo, 
               u.fecha_creacion, u.ultimo_acceso
        FROM USUARIOS u
        INNER JOIN ROLES r ON u.id_rol = r.id_rol
        WHERE u.nombre_usuario = p_nombre_usuario
          AND u.activo = 'S';
END;
/

-- Consultar Usuario por ID
CREATE OR REPLACE PROCEDURE sp_consultar_usuario_id (
    p_id_usuario IN USUARIOS.ID_USUARIO%TYPE,
    p_cursor     OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.nombre_usuario, 
               u.contrasena, u.email, u.nombre_completo, u.activo, 
               u.fecha_creacion, u.ultimo_acceso
        FROM USUARIOS u
        INNER JOIN ROLES r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = p_id_usuario
          AND u.activo = 'S';
END;
/

-- Listar Usuarios
CREATE OR REPLACE PROCEDURE sp_listar_usuarios (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.nombre_usuario,
               u.email, u.nombre_completo, u.activo, u.ultimo_acceso
        FROM USUARIOS u
        INNER JOIN ROLES r ON u.id_rol = r.id_rol
        ORDER BY u.id_usuario;
END;
/

-- Cambiar Contraseña
CREATE OR REPLACE PROCEDURE sp_cambiar_contrasena (
    p_nombre_usuario IN USUARIOS.NOMBRE_USUARIO%TYPE,
    p_nueva_contrasena IN USUARIOS.CONTRASENA%TYPE
) AS
BEGIN
    UPDATE USUARIOS
    SET contrasena = p_nueva_contrasena
    WHERE nombre_usuario = p_nombre_usuario;
    
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- Desactivar Usuario
CREATE OR REPLACE PROCEDURE sp_eliminar_usuario (
    p_id_usuario IN USUARIOS.ID_USUARIO%TYPE,
    p_resultado  OUT NUMBER
) AS
BEGIN
    UPDATE USUARIOS
    SET activo = 'N'
    WHERE id_usuario = p_id_usuario;
    
    p_resultado := SQL%ROWCOUNT;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_resultado := -1;
        RAISE;
END;
/

-- Activar Usuario 
CREATE OR REPLACE PROCEDURE sp_activar_usuario (
    p_id_usuario IN USUARIOS.ID_USUARIO%TYPE,
    p_resultado  OUT NUMBER
) AS
BEGIN
    UPDATE USUARIOS
    SET activo = 'S'
    WHERE id_usuario = p_id_usuario;
    
    p_resultado := SQL%ROWCOUNT;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_resultado := -1;
        RAISE;
END;
/