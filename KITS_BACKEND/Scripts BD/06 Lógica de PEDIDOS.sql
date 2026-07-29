-- SCRIPT 06: LÓGICA DE  PEDIDOS SPs



-- Insertar Detalles
CREATE OR REPLACE PROCEDURE sp_insertar_detalles_pedido (
    p_id_pedido  IN PEDIDO_PRODUCTO.ID_PEDIDO%TYPE,
    p_detalles   IN t_lista_detalles
) AS
BEGIN
    -- No se valida stock aquí: al tomar el pedido todavía no se sabe si habrá
    -- producto (para el jueves se hornea el jueves). El stock se valida y se
    -- descuenta cuando cocina toma el pedido (sp_aplicar_stock_pedido).
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



-- ============================================================================
-- CONTROL DE STOCK
--
-- Los productos de un pedido salen del inventario cuando COCINA TOMA EL PEDIDO
-- (PENDIENTE -> EN_PROCESO), no cuando el vendedor lo registra. Así el descuento
-- ocurre siempre contra el stock que existe el día en que se prepara, sin
-- importar si el pedido es para hoy, para mañana o para dentro de un mes.
--
-- Invariante: PEDIDOS.stock_aplicado = 'S' <=> estado IN ('EN_PROCESO','LISTO','ENTREGADO')
-- La columna hace que aplicar/revertir sea idempotente.
-- ============================================================================

-- Descuenta del inventario todos los productos del pedido. Idempotente.
CREATE OR REPLACE PROCEDURE sp_aplicar_stock_pedido (
    p_id_pedido IN PEDIDOS.ID_PEDIDO%TYPE
) AS
    v_aplicado   PEDIDOS.STOCK_APLICADO%TYPE;
    v_nombre     PRODUCTOS.NOMBRE%TYPE;
    v_disponible PRODUCTOS.STOCK_ACTUAL%TYPE;
    v_solicitado PEDIDO_PRODUCTO.CANTIDAD%TYPE;
BEGIN
    -- FOR UPDATE serializa dos cocineros tomando el mismo pedido a la vez.
    SELECT NVL(stock_aplicado, 'N') INTO v_aplicado
    FROM PEDIDOS WHERE id_pedido = p_id_pedido FOR UPDATE;

    IF v_aplicado = 'S' THEN
        RETURN; -- ya salió del inventario, no descontar dos veces
    END IF;

    -- Validar TODAS las líneas antes de tocar nada, para no dejar el inventario
    -- a medias si el pedido tiene varios productos y falla el tercero.
    BEGIN
        SELECT nombre, stock_actual, cantidad
        INTO v_nombre, v_disponible, v_solicitado
        FROM (
            SELECT pr.nombre, pr.stock_actual, pp.cantidad
            FROM PEDIDO_PRODUCTO pp
            INNER JOIN PRODUCTOS pr ON pp.id_producto = pr.id_producto
            WHERE pp.id_pedido = p_id_pedido
              AND pr.stock_actual < pp.cantidad
            ORDER BY pr.nombre
        ) WHERE ROWNUM = 1;

        RAISE_APPLICATION_ERROR(-20001,
            'Stock insuficiente para el producto: ' || v_nombre ||
            '. Disponible: ' || v_disponible || ', Solicitado: ' || v_solicitado);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            NULL; -- hay stock para todas las líneas del pedido
    END;

    UPDATE PRODUCTOS pr
    SET pr.stock_actual = pr.stock_actual -
        (SELECT pp.cantidad FROM PEDIDO_PRODUCTO pp
         WHERE pp.id_pedido = p_id_pedido AND pp.id_producto = pr.id_producto)
    WHERE pr.id_producto IN (SELECT id_producto FROM PEDIDO_PRODUCTO WHERE id_pedido = p_id_pedido);

    UPDATE PEDIDOS SET stock_aplicado = 'S' WHERE id_pedido = p_id_pedido;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        NULL; -- el pedido no existe: nada que descontar
END;
/

-- Devuelve al inventario los productos del pedido. Idempotente.
CREATE OR REPLACE PROCEDURE sp_revertir_stock_pedido (
    p_id_pedido IN PEDIDOS.ID_PEDIDO%TYPE
) AS
    v_aplicado PEDIDOS.STOCK_APLICADO%TYPE;
BEGIN
    SELECT NVL(stock_aplicado, 'N') INTO v_aplicado
    FROM PEDIDOS WHERE id_pedido = p_id_pedido FOR UPDATE;

    IF v_aplicado = 'N' THEN
        RETURN; -- nunca salió del inventario, no hay nada que devolver
    END IF;

    UPDATE PRODUCTOS pr
    SET pr.stock_actual = pr.stock_actual +
        (SELECT pp.cantidad FROM PEDIDO_PRODUCTO pp
         WHERE pp.id_pedido = p_id_pedido AND pp.id_producto = pr.id_producto)
    WHERE pr.id_producto IN (SELECT id_producto FROM PEDIDO_PRODUCTO WHERE id_pedido = p_id_pedido);

    UPDATE PEDIDOS SET stock_aplicado = 'N' WHERE id_pedido = p_id_pedido;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        NULL; -- el pedido no existe: nada que devolver
END;
/

-- Deja el inventario coherente con el estado destino del pedido.
CREATE OR REPLACE PROCEDURE sp_sincronizar_stock_pedido (
    p_id_pedido IN PEDIDOS.ID_PEDIDO%TYPE,
    p_estado    IN PEDIDOS.ESTADO%TYPE
) AS
BEGIN
    IF p_estado IN ('EN_PROCESO', 'LISTO', 'ENTREGADO') THEN
        sp_aplicar_stock_pedido(p_id_pedido);
    ELSE
        -- PENDIENTE o CANCELADO: el producto vuelve (o nunca salió) al inventario.
        sp_revertir_stock_pedido(p_id_pedido);
    END IF;
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

-- Parte de producción: qué hay que hornear para una fecha.
-- Es la vista de cocina; responde "para el jueves necesito 40 donas y tengo 12".
CREATE OR REPLACE PROCEDURE sp_produccion_requerida (
    p_fecha  IN DATE,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT pr.id_producto,
               pr.nombre,
               pr.unidad_medida,
               pr.stock_actual,
               -- Pedidos del día que todavía NO salieron del inventario.
               NVL(SUM(CASE WHEN p.estado = 'PENDIENTE' THEN pp.cantidad END), 0) AS por_preparar,
               -- Pedidos del día ya tomados por cocina (su stock ya se descontó).
               NVL(SUM(CASE WHEN p.estado IN ('EN_PROCESO','LISTO') THEN pp.cantidad END), 0) AS ya_alistado,
               -- Cuánto falta hornear para poder cubrir lo que aún está pendiente.
               GREATEST(NVL(SUM(CASE WHEN p.estado = 'PENDIENTE' THEN pp.cantidad END), 0)
                        - pr.stock_actual, 0) AS faltante
        FROM PEDIDO_PRODUCTO pp
        INNER JOIN PEDIDOS p   ON pp.id_pedido = p.id_pedido
        INNER JOIN PRODUCTOS pr ON pp.id_producto = pr.id_producto
        WHERE TRUNC(p.fecha_programada) = TRUNC(p_fecha)
          AND p.estado IN ('PENDIENTE', 'EN_PROCESO', 'LISTO')
        GROUP BY pr.id_producto, pr.nombre, pr.unidad_medida, pr.stock_actual
        ORDER BY pr.nombre;
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
    v_id_pedido     NUMBER;
    v_estado_actual PEDIDOS.ESTADO%TYPE;
BEGIN
    IF p_id_pedido IS NOT NULL THEN
        -- EDITAR: solo mientras el pedido siga PENDIENTE. Una vez que cocina lo
        -- toma, sus productos ya salieron del inventario y cambiar las líneas
        -- dejaría el stock descuadrado.
        SELECT estado INTO v_estado_actual FROM PEDIDOS WHERE id_pedido = p_id_pedido;

        IF v_estado_actual <> 'PENDIENTE' THEN
            RAISE_APPLICATION_ERROR(-20003,
                'Solo se pueden modificar pedidos en estado PENDIENTE. Estado actual: ' || v_estado_actual);
        END IF;

        DELETE FROM PEDIDO_PRODUCTO WHERE id_pedido = p_id_pedido;
        v_id_pedido := p_id_pedido;

        UPDATE PEDIDOS
        SET id_cliente = p_id_cliente,
            id_usuario_responsable = p_id_usuario,
            fecha_programada = p_fecha_prog,
            estado = NVL(p_estado, 'PENDIENTE'),
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

    -- Un pedido creado directamente en un estado avanzado (carga de datos,
    -- correcciones) también tiene que reflejarse en el inventario.
    sp_sincronizar_stock_pedido(v_id_pedido, NVL(p_estado, 'PENDIENTE'));

    p_id_resultado := v_id_pedido;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20004, 'El pedido ' || p_id_pedido || ' no existe.');
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

    p_resultado := SQL%ROWCOUNT;

    IF p_resultado > 0 THEN
        -- Aquí es donde el producto sale del inventario (o vuelve, si se cancela).
        -- Si no hay stock suficiente, sp_aplicar_stock_pedido lanza ORA-20001 y
        -- el cambio de estado se revierte completo.
        sp_sincronizar_stock_pedido(p_id_pedido, p_estado);

        IF p_estado IN ('LISTO', 'ENTREGADO') THEN
            sp_calcular_total(p_id_pedido);
        END IF;
    END IF;
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
    -- Si el pedido ya había salido del inventario, devolverlo antes de borrar
    -- las líneas (después ya no se sabría qué devolver).
    sp_revertir_stock_pedido(p_id_pedido);

    -- Borrar detalle manualmente primero
    DELETE FROM PEDIDO_PRODUCTO WHERE id_pedido = p_id_pedido;

    -- Borrar cabecera
    DELETE FROM PEDIDOS WHERE id_pedido = p_id_pedido;

    p_resultado := SQL%ROWCOUNT;
END;
/
