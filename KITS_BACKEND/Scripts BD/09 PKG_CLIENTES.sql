-- SCRIPT 09: PAQUETE DE CLIENTES

CREATE OR REPLACE PACKAGE PKG_CLIENTES AS
    -- p_incluir_inactivos = 'S' para el mantenimiento de clientes; 'N' para tomar pedidos
    PROCEDURE sp_op_listar_clientes(
        p_incluir_inactivos IN CHAR,
        p_res OUT SYS_REFCURSOR
    );

    PROCEDURE sp_op_consultar_cliente(
        p_id  IN NUMBER,
        p_res OUT SYS_REFCURSOR
    );

    PROCEDURE sp_op_gestionar_cliente(
        p_id    IN NUMBER,
        p_nom   IN VARCHAR2,
        p_tel   IN VARCHAR2,
        p_dir   IN VARCHAR2,
        p_mail  IN VARCHAR2,
        p_notas IN VARCHAR2,
        p_res   OUT NUMBER
    );

    -- Baja lógica (activo = 'N'); la fila se conserva por el historial de pedidos
    PROCEDURE sp_op_eliminar_cliente(
        p_id  IN NUMBER,
        p_res OUT NUMBER
    );

    PROCEDURE sp_op_activar_cliente(
        p_id  IN NUMBER,
        p_res OUT NUMBER
    );
END PKG_CLIENTES;
/

CREATE OR REPLACE PACKAGE BODY PKG_CLIENTES AS
    
    --sp_listar_clientes
    PROCEDURE sp_op_listar_clientes(p_incluir_inactivos IN CHAR, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_listar_clientes(p_incluir_inactivos, p_res);
    END;
    
    --sp_consultar_cliente
    PROCEDURE sp_op_consultar_cliente(p_id IN NUMBER, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_consultar_cliente(p_id, p_res);
    END;
    
    --sp_gestionar_cliente
    PROCEDURE sp_op_gestionar_cliente(
        p_id    IN NUMBER, 
        p_nom   IN VARCHAR2, 
        p_tel   IN VARCHAR2, 
        p_dir   IN VARCHAR2, 
        p_mail  IN VARCHAR2, 
        p_notas IN VARCHAR2, 
        p_res   OUT NUMBER
    ) IS
    BEGIN
        sp_gestionar_cliente(p_id, p_nom, p_tel, p_dir, p_mail, p_notas, p_res);
    END;

    --sp_eliminar_cliente
    PROCEDURE sp_op_eliminar_cliente(p_id IN NUMBER, p_res OUT NUMBER) IS
    BEGIN
        sp_eliminar_cliente(p_id, p_res);
    END;

    --sp_activar_cliente
    PROCEDURE sp_op_activar_cliente(p_id IN NUMBER, p_res OUT NUMBER) IS
    BEGIN
        sp_activar_cliente(p_id, p_res);
    END;

END PKG_CLIENTES;
/