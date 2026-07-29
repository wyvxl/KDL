-- SCRIPT 10: PAQUETE DE PRODUCTOS

CREATE OR REPLACE PACKAGE PKG_PRODUCTOS AS
    PROCEDURE sp_op_listar_productos(
        p_res OUT SYS_REFCURSOR
    );

    PROCEDURE sp_op_consultar_producto(
        p_id IN NUMBER,
        p_res OUT SYS_REFCURSOR
    );

    PROCEDURE sp_op_gestionar_producto(
        p_id IN NUMBER,
        p_nom IN VARCHAR2,
        p_desc IN VARCHAR2,
        p_precio IN NUMBER,
        p_stock IN NUMBER,
        p_min IN NUMBER,
        p_uni IN VARCHAR2,
        p_activo IN VARCHAR2,
        p_res OUT NUMBER
    );

    PROCEDURE sp_op_ajustar_stock(
        p_id_prod IN NUMBER,
        p_cant IN NUMBER,
        p_mov IN VARCHAR2
    );

    -- Catálogo con stock comprometido y disponible para una fecha (toma de pedidos)
    PROCEDURE sp_op_disponibilidad(
        p_fecha IN DATE,
        p_excluir_pedido IN NUMBER,
        p_res OUT SYS_REFCURSOR
    );
END PKG_PRODUCTOS;
/

CREATE OR REPLACE PACKAGE BODY PKG_PRODUCTOS AS

    --sp_listar_productos
    PROCEDURE sp_op_listar_productos(p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_listar_productos(p_res);
    END;

    --sp_consultar_producto
    PROCEDURE sp_op_consultar_producto(p_id IN NUMBER, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_consultar_producto(p_id, p_res);
    END;

    --sp_gestionar_producto
    PROCEDURE sp_op_gestionar_producto(p_id IN NUMBER, p_nom IN VARCHAR2, p_desc IN VARCHAR2,
                                       p_precio IN NUMBER, p_stock IN NUMBER, p_min IN NUMBER,
                                       p_uni IN VARCHAR2, p_activo IN VARCHAR2, p_res OUT NUMBER) IS 
    BEGIN
        sp_gestionar_producto(p_id, p_nom, p_desc, p_precio, p_stock, p_min, p_uni, p_activo,
                              p_res); 
    END;

    --sp_ajustar_stock
    PROCEDURE sp_op_ajustar_stock(p_id_prod IN NUMBER, p_cant IN NUMBER, p_mov IN VARCHAR2) IS
    BEGIN
        sp_ajustar_stock(p_id_prod, p_cant, p_mov);
    END;

    --sp_disponibilidad_productos
    PROCEDURE sp_op_disponibilidad(p_fecha IN DATE, p_excluir_pedido IN NUMBER, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_disponibilidad_productos(p_fecha, p_excluir_pedido, p_res);
    END;

END PKG_PRODUCTOS;
/