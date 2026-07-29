-- SCRIPT 05: LÓGICA CLIENTES Y PRODUCTOS SPs

-- Gestionar Cliente
CREATE OR REPLACE PROCEDURE sp_gestionar_cliente (
    p_id_cliente   IN CLIENTES.ID_CLIENTE%TYPE,
    p_nombre       IN CLIENTES.NOMBRE%TYPE,
    p_telefono     IN CLIENTES.TELEFONO%TYPE,
    p_direccion    IN CLIENTES.DIRECCION%TYPE,
    p_email        IN CLIENTES.EMAIL%TYPE,
    p_notas        IN CLIENTES.NOTAS%TYPE,
    p_id_resultado OUT CLIENTES.ID_CLIENTE%TYPE
) AS
BEGIN
    IF p_id_cliente IS NULL THEN
        INSERT INTO CLIENTES (nombre, telefono, direccion, email, notas)
        VALUES (p_nombre, p_telefono, p_direccion, p_email, p_notas)
        RETURNING id_cliente INTO p_id_resultado;
    ELSE
        UPDATE CLIENTES SET nombre=p_nombre, telefono=p_telefono, direccion=p_direccion, email=p_email, notas=p_notas
        WHERE id_cliente=p_id_cliente;
        p_id_resultado := p_id_cliente;
    END IF;
    COMMIT;
EXCEPTION WHEN OTHERS THEN ROLLBACK; RAISE;
END;
/

-- Listar Clientes
--
-- Por defecto solo devuelve los activos, que es lo que necesita la toma de pedidos.
-- La pantalla de mantenimiento de clientes pide p_incluir_inactivos = 'S' para poder
-- mostrarlos y reactivarlos; si no, un cliente dado de baja desaparecería para siempre.
CREATE OR REPLACE PROCEDURE sp_listar_clientes (
    p_incluir_inactivos IN CHAR DEFAULT 'N',
    p_cursor            OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_cliente, nombre, telefono, direccion, email, notas, activo, fecha_registro
        FROM CLIENTES
        WHERE NVL(p_incluir_inactivos, 'N') = 'S' OR activo = 'S'
        ORDER BY nombre;
END;
/

-- Desactivar Cliente (baja lógica)
--
-- No se borra la fila: PEDIDOS.id_cliente la referencia y el historial de pedidos
-- tiene que seguir siendo consultable. El cliente solo deja de ofrecerse al tomar
-- pedidos nuevos.
CREATE OR REPLACE PROCEDURE sp_eliminar_cliente (
    p_id_cliente IN CLIENTES.ID_CLIENTE%TYPE,
    p_resultado  OUT NUMBER
) AS
BEGIN
    UPDATE CLIENTES
    SET activo = 'N'
    WHERE id_cliente = p_id_cliente;

    p_resultado := SQL%ROWCOUNT;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_resultado := -1;
        RAISE;
END;
/

-- Reactivar Cliente
CREATE OR REPLACE PROCEDURE sp_activar_cliente (
    p_id_cliente IN CLIENTES.ID_CLIENTE%TYPE,
    p_resultado  OUT NUMBER
) AS
BEGIN
    UPDATE CLIENTES
    SET activo = 'S'
    WHERE id_cliente = p_id_cliente;

    p_resultado := SQL%ROWCOUNT;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_resultado := -1;
        RAISE;
END;
/

-- Consultar Cliente por ID
CREATE OR REPLACE PROCEDURE sp_consultar_cliente (
    p_id_cliente IN CLIENTES.ID_CLIENTE%TYPE,
    p_cursor     OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_cliente, nombre, telefono, direccion, email, notas, activo, fecha_registro
        FROM CLIENTES
        WHERE id_cliente = p_id_cliente;
END;
/

-- Gestionar Producto
CREATE OR REPLACE PROCEDURE sp_gestionar_producto (
    p_id_producto   IN PRODUCTOS.ID_PRODUCTO%TYPE,
    p_nombre        IN PRODUCTOS.NOMBRE%TYPE,
    p_descripcion   IN PRODUCTOS.DESCRIPCION%TYPE,
    p_precio        IN PRODUCTOS.PRECIO%TYPE,
    p_stock_actual  IN PRODUCTOS.STOCK_ACTUAL%TYPE,
    p_stock_minimo  IN PRODUCTOS.STOCK_MINIMO%TYPE,
    p_unidad        IN PRODUCTOS.UNIDAD_MEDIDA%TYPE,
    p_activo        IN PRODUCTOS.ACTIVO%TYPE,
    p_id_resultado  OUT PRODUCTOS.ID_PRODUCTO%TYPE
) AS
BEGIN
    IF p_id_producto IS NULL THEN
        INSERT INTO PRODUCTOS (nombre, descripcion, precio, stock_actual, stock_minimo, unidad_medida, activo)
        VALUES (p_nombre, p_descripcion, p_precio, NVL(p_stock_actual,0), p_stock_minimo, p_unidad, NVL(p_activo, 'S'))
        RETURNING id_producto INTO p_id_resultado;
    ELSE
        UPDATE PRODUCTOS SET nombre=p_nombre, descripcion=p_descripcion, precio=p_precio,
               stock_actual=NVL(p_stock_actual, stock_actual), stock_minimo=p_stock_minimo,
               unidad_medida=p_unidad, activo=NVL(p_activo, activo) -- Actualizar el estado activo
        WHERE id_producto=p_id_producto;
        p_id_resultado := p_id_producto;
    END IF;
    COMMIT;
EXCEPTION WHEN OTHERS THEN ROLLBACK; RAISE;
END;
/

-- Listar Productos
CREATE OR REPLACE PROCEDURE sp_listar_productos (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_producto, nombre, descripcion, precio, stock_actual,
               stock_minimo, unidad_medida, activo, fecha_creacion
        FROM PRODUCTOS
        ORDER BY nombre; 
END;
/

-- Consultar Producto por ID
CREATE OR REPLACE PROCEDURE sp_consultar_producto (
    p_id_producto IN PRODUCTOS.ID_PRODUCTO%TYPE,
    p_cursor      OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_producto, nombre, descripcion, precio, stock_actual,
               stock_minimo, unidad_medida, activo, fecha_creacion
        FROM PRODUCTOS
        WHERE id_producto = p_id_producto;
END;
/

-- Disponibilidad de Productos para una fecha
--
-- Es lo que el vendedor necesita ver al tomar el pedido: cuánto puede prometer.
--
--   disponible = stock_actual - comprometido
--   comprometido = suma de los pedidos aún PENDIENTES con fecha_programada <= p_fecha
--
-- Solo cuentan los PENDIENTES porque los pedidos que cocina ya tomó
-- (EN_PROCESO en adelante) descontaron su stock de stock_actual.
--
-- p_excluir_pedido permite editar un pedido sin que sus propias cantidades
-- se cuenten como comprometidas contra sí mismo.
CREATE OR REPLACE PROCEDURE sp_disponibilidad_productos (
    p_fecha          IN DATE,
    p_excluir_pedido IN PEDIDOS.ID_PEDIDO%TYPE DEFAULT NULL,
    p_cursor         OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT pr.id_producto, pr.nombre, pr.descripcion, pr.precio,
               pr.stock_actual, pr.stock_minimo, pr.unidad_medida, pr.activo,
               NVL(c.comprometido, 0) AS comprometido,
               pr.stock_actual - NVL(c.comprometido, 0) AS disponible
        FROM PRODUCTOS pr
        LEFT JOIN (
            SELECT pp.id_producto, SUM(pp.cantidad) AS comprometido
            FROM PEDIDO_PRODUCTO pp
            INNER JOIN PEDIDOS p ON pp.id_pedido = p.id_pedido
            WHERE p.estado = 'PENDIENTE'
              AND TRUNC(p.fecha_programada) <= TRUNC(p_fecha)
              AND (p_excluir_pedido IS NULL OR p.id_pedido <> p_excluir_pedido)
            GROUP BY pp.id_producto
        ) c ON c.id_producto = pr.id_producto
        WHERE pr.activo = 'S'
        ORDER BY pr.nombre;
END;
/

-- Ajustar Stock (entrada por producción, salida por merma)
CREATE OR REPLACE PROCEDURE sp_ajustar_stock (
    p_id_producto IN PRODUCTOS.ID_PRODUCTO%TYPE,
    p_cantidad    IN NUMBER,
    p_movimiento  IN VARCHAR2
) AS
    v_stock_actual PRODUCTOS.STOCK_ACTUAL%TYPE;
    v_nombre       PRODUCTOS.NOMBRE%TYPE;
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'La cantidad a ajustar debe ser mayor que cero.');
    END IF;

    IF p_movimiento NOT IN ('ENTRADA', 'SALIDA') THEN
        RAISE_APPLICATION_ERROR(-20006, 'Movimiento inválido: ' || p_movimiento || '. Use ENTRADA o SALIDA.');
    END IF;

    SELECT stock_actual, nombre INTO v_stock_actual, v_nombre
    FROM PRODUCTOS WHERE id_producto = p_id_producto FOR UPDATE;

    IF p_movimiento = 'ENTRADA' THEN
        UPDATE PRODUCTOS SET stock_actual = stock_actual + p_cantidad WHERE id_producto = p_id_producto;
    ELSE
        -- Mensaje claro en vez de dejar que reviente el CHECK (stock_actual >= 0).
        IF v_stock_actual < p_cantidad THEN
            RAISE_APPLICATION_ERROR(-20001,
                'Stock insuficiente para el producto: ' || v_nombre ||
                '. Disponible: ' || v_stock_actual || ', Solicitado: ' || p_cantidad);
        END IF;
        UPDATE PRODUCTOS SET stock_actual = stock_actual - p_cantidad WHERE id_producto = p_id_producto;
    END IF;
    COMMIT;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20007, 'El producto ' || p_id_producto || ' no existe.');
    WHEN OTHERS THEN ROLLBACK; RAISE;
END;
/