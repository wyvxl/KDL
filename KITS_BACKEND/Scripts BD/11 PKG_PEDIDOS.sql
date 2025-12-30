-- SCRIPT 11: PAQUETE DE PEDIDOS
--Commits en PKG por funcionalidad

CREATE OR REPLACE PACKAGE PKG_PEDIDOS AS
    PROCEDURE sp_op_listar_pedidos(
        p_res OUT SYS_REFCURSOR
    );
    
    PROCEDURE sp_op_listar_detalles(
        p_id_pedido IN NUMBER,
        p_res       OUT SYS_REFCURSOR
    );
    

    
    PROCEDURE sp_op_actualizar_estado(
        p_id         IN NUMBER,
        p_estado     IN VARCHAR2,
        p_id_usuario IN NUMBER DEFAULT NULL,
        p_res        OUT NUMBER
    );
    
    PROCEDURE sp_op_crear_pedido_completo(
        p_id       IN NUMBER DEFAULT NULL,
        p_cli      IN NUMBER,
        p_usu      IN NUMBER,
        p_fecha    IN DATE,
        p_estado   IN VARCHAR2,
        p_pagado   IN VARCHAR2,
        p_detalles IN t_lista_detalles,
        p_res      OUT NUMBER
    );
    
    PROCEDURE sp_op_marcar_pagado(
        p_id  IN NUMBER,
        p_res OUT NUMBER
    );
    
    PROCEDURE sp_op_eliminar_pedido(
        p_id  IN NUMBER,
        p_res OUT NUMBER
    );
END PKG_PEDIDOS;
/

CREATE OR REPLACE PACKAGE BODY PKG_PEDIDOS AS
    
    --sp_listar_pedidos
    PROCEDURE sp_op_listar_pedidos(p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_listar_pedidos(p_res);
    END;
    
    --sp_listar_detalles_pedido
    PROCEDURE sp_op_listar_detalles(p_id_pedido IN NUMBER, p_res OUT SYS_REFCURSOR) IS
    BEGIN
        sp_listar_detalles_pedido(p_id_pedido, p_res);
    END;
    


    --sp_actualizar_estado_pedido
    PROCEDURE sp_op_actualizar_estado(p_id IN NUMBER, p_estado IN VARCHAR2, p_id_usuario IN NUMBER DEFAULT NULL, p_res OUT NUMBER) IS
    BEGIN
        sp_actualizar_estado_pedido(p_id, p_estado, p_id_usuario, p_res);
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_res := -1;
            RAISE;
    END;
    
    --sp_crear_pedido_completo
    PROCEDURE sp_op_crear_pedido_completo(
        p_id       IN NUMBER DEFAULT NULL,
        p_cli      IN NUMBER,
        p_usu      IN NUMBER,
        p_fecha    IN DATE,
        p_estado   IN VARCHAR2,
        p_pagado   IN VARCHAR2,
        p_detalles IN t_lista_detalles,
        p_res      OUT NUMBER
    ) IS
    BEGIN
        sp_crear_pedido_completo(p_id, p_cli, p_usu, p_fecha, p_estado, p_pagado, p_detalles, p_res);
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END;
    
    --sp_marcar_pagado
    PROCEDURE sp_op_marcar_pagado(p_id IN NUMBER, p_res OUT NUMBER) IS
    BEGIN
        sp_marcar_pagado(p_id, p_res);
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_res := -1;
            RAISE;
    END;
    
    --sp_eliminar_pedido
    PROCEDURE sp_op_eliminar_pedido(p_id IN NUMBER, p_res OUT NUMBER) IS
    BEGIN
        sp_eliminar_pedido(p_id, p_res);
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_res := -1;
            RAISE;
    END;
    
END PKG_PEDIDOS;
/