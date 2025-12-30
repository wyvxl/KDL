-- SCRIPT 08: PAQUETE DE USUARIOS

CREATE OR REPLACE PACKAGE PKG_USUARIOS AS
    -- GESTIONAR 
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
    
    -- BUSCAR POR NOMBRE DE USUARIO
    PROCEDURE sp_op_buscar_usuario(
        p_user IN VARCHAR2,
        p_res  OUT SYS_REFCURSOR
    );
    
    -- CONSULTAR POR ID
    PROCEDURE sp_op_consultar_usuario_id(
        p_id  IN NUMBER,
        p_res OUT SYS_REFCURSOR
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
    
    -- DESACTIVAR 
    PROCEDURE sp_op_eliminar_usuario(
        p_id  IN NUMBER,
        p_res OUT NUMBER
    );
    
    -- ACTIVAR
    PROCEDURE sp_op_activar_usuario(
        p_id  IN NUMBER,
        p_res OUT NUMBER
    );
    
END PKG_USUARIOS;
/


CREATE OR REPLACE PACKAGE BODY PKG_USUARIOS AS
    
    --sp_gestionar_usuario
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
        sp_gestionar_usuario(p_id, p_rol, p_user, p_pass, p_mail, p_nom, p_res);
    END;

    --sp_autenticar_usuario
    PROCEDURE sp_op_autenticar(p_user IN VARCHAR2, p_pass IN VARCHAR2, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_autenticar_usuario(p_user, p_pass, p_res);
    END;
    
    --sp_buscar_usuario
    PROCEDURE sp_op_buscar_usuario(p_user IN VARCHAR2, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_buscar_usuario(p_user, p_res);
    END;
    
    --sp_consultar_usuario_id
    PROCEDURE sp_op_consultar_usuario_id(p_id IN NUMBER, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_consultar_usuario_id(p_id, p_res);
    END;
    
    --sp_listar_usuarios
    PROCEDURE sp_op_listar_usuarios(p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_listar_usuarios(p_res);
    END;
    
    --sp_cambiar_contrasena
    PROCEDURE sp_op_cambiar_contrasena(p_user IN VARCHAR2, p_new_pass IN VARCHAR2) IS
    BEGIN
        sp_cambiar_contrasena(p_user, p_new_pass);
    END;
    
    --sp_eliminar_usuario
    PROCEDURE sp_op_eliminar_usuario(p_id IN NUMBER, p_res OUT NUMBER) IS
    BEGIN
        sp_eliminar_usuario(p_id, p_res);
    END;
    
    --sp_activar_usuario
    PROCEDURE sp_op_activar_usuario(p_id IN NUMBER, p_res OUT NUMBER) IS
    BEGIN
        sp_activar_usuario(p_id, p_res);
    END;
    
END PKG_USUARIOS;
/
