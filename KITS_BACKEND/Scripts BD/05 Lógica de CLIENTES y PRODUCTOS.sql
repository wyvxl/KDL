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
CREATE OR REPLACE PROCEDURE sp_listar_clientes (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_cliente, nombre, telefono, direccion, email, notas, activo, fecha_registro
        FROM CLIENTES
        WHERE activo = 'S'
        ORDER BY nombre;
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

-- Ajustar Stock
CREATE OR REPLACE PROCEDURE sp_ajustar_stock (
    p_id_producto IN PRODUCTOS.ID_PRODUCTO%TYPE,
    p_cantidad    IN NUMBER,
    p_movimiento  IN VARCHAR2
) AS
BEGIN
    IF p_movimiento = 'ENTRADA' THEN
        UPDATE PRODUCTOS SET stock_actual = stock_actual + p_cantidad WHERE id_producto = p_id_producto;
    ELSIF p_movimiento = 'SALIDA' THEN
        UPDATE PRODUCTOS SET stock_actual = stock_actual - p_cantidad WHERE id_producto = p_id_producto;
    END IF;
    COMMIT;
EXCEPTION WHEN OTHERS THEN ROLLBACK; RAISE;
END;
/