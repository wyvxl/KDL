-- =================================================================
-- PAQUETE DE USUARIOS (VERSIÓN CORREGIDA Y CENTRALIZADA)
-- Este script contiene toda la lógica necesaria.
-- =================================================================

CREATE OR REPLACE PACKAGE PKG_USUARIOS AS
    -- GESTIONAR (CREAR Y ACTUALIZAR)
    PROCEDURE sp_op_gestionar_usuario(
        p_id   IN USUARIOS.ID_USUARIO%TYPE,
        p_rol  IN USUARIOS.ID_ROL%TYPE,
        p_user IN USUARIOS.NOMBRE_USUARIO%TYPE,
        p_pass IN USUARIOS.CONTRASENA%TYPE,
        p_mail IN USUARIOS.EMAIL%TYPE,
        p_nom  IN USUARIOS.NOMBRE_COMPLETO%TYPE,
        p_res  OUT NUMBER
    );

    -- AUTENTICAR
    PROCEDURE sp_op_autenticar(
        p_user IN VARCHAR2,
        p_pass IN VARCHAR2,
        p_res  OUT SYS_REFCURSOR
    );

    -- BUSCAR
    PROCEDURE sp_op_buscar_usuario(
        p_user IN VARCHAR2,
        p_res  OUT SYS_REFCURSOR
    );

    -- LISTAR
    PROCEDURE sp_op_listar_usuarios(
        p_res OUT SYS_REFCURSOR
    );

    -- CAMBIAR CONTRASEÑA
    PROCEDURE sp_op_cambiar_contrasena(
        p_user IN VARCHAR2,
        p_new_pass IN VARCHAR2
    );

END PKG_USUARIOS;
/

CREATE OR REPLACE PACKAGE BODY PKG_USUARIOS AS

    -- LÓGICA DE GESTIÓN CENTRALIZADA DENTRO DEL PAQUETE
    PROCEDURE sp_op_gestionar_usuario(
        p_id   IN USUARIOS.ID_USUARIO%TYPE,
        p_rol  IN USUARIOS.ID_ROL%TYPE,
        p_user IN USUARIOS.NOMBRE_USUARIO%TYPE,
        p_pass IN USUARIOS.CONTRASENA%TYPE,
        p_mail IN USUARIOS.EMAIL%TYPE,
        p_nom  IN USUARIOS.NOMBRE_COMPLETO%TYPE,
        p_res  OUT NUMBER
    ) IS
    BEGIN
        IF p_id IS NULL THEN
            -- Si el ID es nulo, es una INSERCIÓN
            INSERT INTO USUARIOS (id_rol, nombre_usuario, contrasena, email, nombre_completo)
            VALUES (p_rol, p_user, p_pass, p_mail, p_nom)
            RETURNING id_usuario INTO p_res;
        ELSE
            -- Si el ID existe, es una ACTUALIZACIÓN
            UPDATE USUARIOS
            SET id_rol = p_rol,
                nombre_usuario = p_user,
                -- Solo actualiza la contraseña si se proporciona una nueva; si no, mantiene la existente.
                contrasena = NVL(p_pass, contrasena),
                email = p_mail,
                nombre_completo = p_nom
            WHERE id_usuario = p_id;

            p_res := p_id; -- Devuelve el ID del usuario actualizado
        END IF;

        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_res := -1; -- Indicar error
            RAISE;
    END;

    -- AUTENTICAR (Usa el procedimiento base)
    PROCEDURE sp_op_autenticar(p_user IN VARCHAR2, p_pass IN VARCHAR2, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_autenticar_usuario(p_user, p_pass, p_res);
    END;

    -- BUSCAR
    PROCEDURE sp_op_buscar_usuario(p_user IN VARCHAR2, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        OPEN p_res FOR
            SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.nombre_usuario,
                   u.contrasena, u.email, u.nombre_completo, u.activo,
                   u.fecha_creacion, u.ultimo_acceso
            FROM USUARIOS u
                     INNER JOIN ROLES r ON u.id_rol = r.id_rol
            WHERE u.nombre_usuario = p_user
              AND u.activo = 'S';
    END;

    -- LISTAR
    PROCEDURE sp_op_listar_usuarios(p_res OUT SYS_REFCURSOR) IS
    BEGIN
        OPEN p_res FOR
            SELECT u.id_usuario, u.id_rol, r.nombre_rol, u.nombre_usuario,
                   u.email, u.nombre_completo, u.activo
            FROM USUARIOS u
                     INNER JOIN ROLES r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario;
    END;

    -- CAMBIAR CONTRASEÑA
    PROCEDURE sp_op_cambiar_contrasena(p_user IN VARCHAR2, p_new_pass IN VARCHAR2) IS
    BEGIN
        UPDATE USUARIOS
        SET contrasena = p_new_pass
        WHERE nombre_usuario = p_user;

        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END;

END PKG_USUARIOS;
/