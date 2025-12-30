-- SCRIPT 07: PAQUETE DE ROLES 

CREATE OR REPLACE PACKAGE PKG_ROLES AS
    PROCEDURE sp_op_listar_roles(
        p_res OUT SYS_REFCURSOR
    );
    
    -- Crear nuevo rol
    PROCEDURE sp_op_crear_rol(
        p_nombre IN ROLES.NOMBRE_ROL%TYPE, 
        p_desc   IN ROLES.DESCRIPCION%TYPE, 
        p_res    OUT NUMBER
    );
END PKG_ROLES;
/

CREATE OR REPLACE PACKAGE BODY PKG_ROLES AS
    
    PROCEDURE sp_op_listar_roles(p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_listar_roles(p_res);
    END;
    
    PROCEDURE sp_op_crear_rol(p_nombre IN ROLES.NOMBRE_ROL%TYPE, p_desc IN ROLES.DESCRIPCION%TYPE, p_res OUT NUMBER) IS
    BEGIN
        sp_crear_rol(p_nombre, p_desc, p_res);
    END;
    
END PKG_ROLES;
/