-- SCRIPT 06: LÓGICA DE  PEDIDOS SPs



-- Insertar Detalles 
CREATE OR REPLACE PROCEDURE sp_insertar_detalles_pedido (
    p_id_pedido  IN PEDIDO_PRODUCTO.ID_PEDIDO%TYPE,
    p_detalles   IN t_lista_detalles 
) AS
    v_stock_actual NUMBER;
    v_nombre_producto VARCHAR2(200);
BEGIN
    -- Validar stock: Se delega al trigger trg_validar_stock_pedido
    -- que verifica fecha y disponibilidad fila por fila.
    -- Si hay stock para todos los productos
    FORALL i IN 1 .. p_detalles.COUNT
        INSERT INTO PEDIDO_PRODUCTO (id_pedido, id_producto, cantidad, precio_unitario)
        VALUES (
            p_id_pedido, 
            p_detalles(i).id_producto, 
            p_detalles(i).cantidad, 
            p_detalles(i).precio
        );
END;
/



-- Calcular Total
CREATE OR REPLACE PROCEDURE sp_calcular_total (p_id_pedido IN PEDIDOS.ID_PEDIDO%TYPE) AS
BEGIN
    UPDATE PEDIDOS SET total = (SELECT NVL(SUM(cantidad*precio_unitario),0) FROM PEDIDO_PRODUCTO WHERE id_pedido=p_id_pedido)
    WHERE id_pedido = p_id_pedido;
END;
/



-- Listar Pedidos
CREATE OR REPLACE PROCEDURE sp_listar_pedidos (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT p.id_pedido, p.id_cliente, c.nombre as nombre_cliente,
               p.id_usuario_responsable, u.nombre_completo as nombre_usuario,
               p.fecha_pedido, p.fecha_programada, p.estado, p.pagado,
               p.total, p.fecha_entrega
        FROM PEDIDOS p
        INNER JOIN CLIENTES c ON p.id_cliente = c.id_cliente
        INNER JOIN USUARIOS u ON p.id_usuario_responsable = u.id_usuario
        ORDER BY p.fecha_programada DESC;
END;
/

-- Consultar Pedido por ID
CREATE OR REPLACE PROCEDURE sp_consultar_pedido (
    p_id_pedido IN PEDIDOS.ID_PEDIDO%TYPE,
    p_cursor    OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT p.id_pedido, p.id_cliente, c.nombre as nombre_cliente,
               p.id_usuario_responsable, u.nombre_completo as nombre_usuario,
               p.fecha_pedido, p.fecha_programada, p.estado, p.pagado,
               p.total, p.fecha_entrega
        FROM PEDIDOS p
        INNER JOIN CLIENTES c ON p.id_cliente = c.id_cliente
        INNER JOIN USUARIOS u ON p.id_usuario_responsable = u.id_usuario
        WHERE p.id_pedido = p_id_pedido;
END;
/

-- Listar Detalles de Pedido
CREATE OR REPLACE PROCEDURE sp_listar_detalles_pedido (
    p_id_pedido IN PEDIDO_PRODUCTO.ID_PEDIDO%TYPE,
    p_cursor    OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT pp.id_pedido, pp.id_producto, pr.nombre as nombre_producto,
               pp.cantidad, pp.precio_unitario
        FROM PEDIDO_PRODUCTO pp
        INNER JOIN PRODUCTOS pr ON pp.id_producto = pr.id_producto
        WHERE pp.id_pedido = p_id_pedido;
END;
/

-- UPSERT Pedido Completo (crear o editar cabecera + detalles)
CREATE OR REPLACE PROCEDURE sp_crear_pedido_completo (
    p_id_pedido       IN PEDIDOS.ID_PEDIDO%TYPE DEFAULT NULL,
    p_id_cliente      IN PEDIDOS.ID_CLIENTE%TYPE,
    p_id_usuario      IN PEDIDOS.ID_USUARIO_RESPONSABLE%TYPE,
    p_fecha_prog      IN PEDIDOS.FECHA_PROGRAMADA%TYPE,
    p_estado          IN PEDIDOS.ESTADO%TYPE,
    p_pagado          IN CHAR DEFAULT 'N',
    p_detalles        IN t_lista_detalles,
    p_id_resultado    OUT PEDIDOS.ID_PEDIDO%TYPE
) AS
    v_id_pedido NUMBER;
BEGIN
    -- Si es ID no nulo, borra detalles viejos PRIMERO.
    -- Esto asegura que el trigger limpieza/stock corra sobre el estado 'limpio' de la cabecera.
    IF p_id_pedido IS NOT NULL THEN
        DELETE FROM PEDIDO_PRODUCTO WHERE id_pedido = p_id_pedido;
        v_id_pedido := p_id_pedido;
        
        -- Actualizar cabecera
        UPDATE PEDIDOS 
        SET id_cliente = p_id_cliente,
            id_usuario_responsable = p_id_usuario,
            fecha_programada = p_fecha_prog,
            estado = p_estado,
            pagado = NVL(p_pagado, 'N')
        WHERE id_pedido = p_id_pedido;
    ELSE
        -- CREAR: Insertar nueva cabecera
        INSERT INTO PEDIDOS (id_cliente, id_usuario_responsable, fecha_pedido, fecha_programada, estado, pagado)
        VALUES (p_id_cliente, p_id_usuario, CURRENT_TIMESTAMP, p_fecha_prog, NVL(p_estado, 'PENDIENTE'), NVL(p_pagado, 'N'))
        RETURNING id_pedido INTO v_id_pedido;
    END IF;
    
    -- 2. Insertar nuevos detalles (si los hay)
    IF p_detalles IS NOT NULL AND p_detalles.COUNT > 0 THEN
        sp_insertar_detalles_pedido(v_id_pedido, p_detalles);
    END IF;
    
    sp_calcular_total(v_id_pedido);
    p_id_resultado := v_id_pedido;
EXCEPTION 
    WHEN OTHERS THEN 
        ROLLBACK; 
        RAISE;
END;
/

-- Actualizar Estado
CREATE OR REPLACE PROCEDURE sp_actualizar_estado_pedido (
    p_id_pedido  IN PEDIDOS.ID_PEDIDO%TYPE,
    p_estado     IN PEDIDOS.ESTADO%TYPE,
    p_id_usuario IN PEDIDOS.ID_USUARIO_RESPONSABLE%TYPE DEFAULT NULL,
    p_resultado  OUT NUMBER
) AS
BEGIN
    UPDATE PEDIDOS
    SET estado = p_estado,
        fecha_entrega = CASE WHEN p_estado = 'ENTREGADO' THEN CURRENT_TIMESTAMP ELSE fecha_entrega END,
        id_usuario_responsable = NVL(p_id_usuario, id_usuario_responsable) -- Actualizar usuario si se provee
    WHERE id_pedido = p_id_pedido;
    
    IF p_estado IN ('LISTO', 'ENTREGADO') THEN
        sp_calcular_total(p_id_pedido);
    END IF;

    p_resultado := SQL%ROWCOUNT;
END;
/

-- Marcar Pagado
CREATE OR REPLACE PROCEDURE sp_marcar_pagado (
    p_id_pedido IN PEDIDOS.ID_PEDIDO%TYPE,
    p_resultado OUT NUMBER
) AS
BEGIN
    UPDATE PEDIDOS
    SET pagado = 'S'
    WHERE id_pedido = p_id_pedido;
    
    p_resultado := SQL%ROWCOUNT;
END;
/

-- Eliminar Pedido
CREATE OR REPLACE PROCEDURE sp_eliminar_pedido (
    p_id_pedido IN PEDIDOS.ID_PEDIDO%TYPE,
    p_resultado OUT NUMBER
) AS
BEGIN
    -- Borrar detalle manualmente primero
    DELETE FROM PEDIDO_PRODUCTO WHERE id_pedido = p_id_pedido;

    -- Borrar cabecera
    DELETE FROM PEDIDOS WHERE id_pedido = p_id_pedido;
    
    p_resultado := SQL%ROWCOUNT;
END;
/