-- SCRIPT 02: Crea tablas, índices y triggers 

-- CREACIÓN DE TABLAS


-- Tabla ROLES: Define los roles de usuario en el sistema
CREATE TABLE ROLES (
    id_rol NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_rol VARCHAR2(50) NOT NULL UNIQUE,
    descripcion VARCHAR2(200),
    activo CHAR(1) DEFAULT 'S' CHECK (activo IN ('S', 'N')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla USUARIOS: Almacena las cuentas de acceso al sistema
CREATE TABLE USUARIOS (
    id_usuario NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rol NUMBER NOT NULL,
    nombre_usuario VARCHAR2(50) NOT NULL UNIQUE,
    contrasena VARCHAR2(255) NOT NULL, 
    email VARCHAR2(100) NOT NULL UNIQUE,
    nombre_completo VARCHAR2(150),
    activo CHAR(1) DEFAULT 'S' CHECK (activo IN ('S', 'N')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) REFERENCES ROLES(id_rol)
);

-- Tabla CLIENTES: Información de contacto de los clientes
CREATE TABLE CLIENTES (
    id_cliente NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR2(150) NOT NULL,
    telefono VARCHAR2(20) NOT NULL,
    direccion VARCHAR2(300),
    email VARCHAR2(100),
    notas VARCHAR2(500), 
    activo CHAR(1) DEFAULT 'S' CHECK (activo IN ('S', 'N')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla PRODUCTOS: Inventario de productos de panadería
CREATE TABLE PRODUCTOS (
    id_producto NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR2(100) NOT NULL,
    descripcion VARCHAR2(300),
    precio NUMBER(10,2) NOT NULL CHECK (precio >= 0),
    stock_actual NUMBER DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo NUMBER DEFAULT 5,
    unidad_medida VARCHAR2(20) DEFAULT 'unidad',
    activo CHAR(1) DEFAULT 'S' CHECK (activo IN ('S', 'N')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla PEDIDOS: Cabecera del pedido con información general
CREATE TABLE PEDIDOS (
    id_pedido NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_cliente NUMBER NOT NULL,
    id_usuario_responsable NUMBER NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_programada DATE NOT NULL, -- Fecha de entrega programada
    estado VARCHAR2(20) DEFAULT 'PENDIENTE' 
        CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO')),
    pagado CHAR(1) DEFAULT 'N' CHECK (pagado IN ('S', 'N')),
    total NUMBER(10,2) DEFAULT 0,
    fecha_entrega TIMESTAMP, -- Fecha real de entrega
    CONSTRAINT fk_pedidos_clientes FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente),
    CONSTRAINT fk_pedidos_usuarios FOREIGN KEY (id_usuario_responsable) REFERENCES USUARIOS(id_usuario)
);

-- Tabla PEDIDO_PRODUCTO: Detalle de los artículos en cada pedido
CREATE TABLE PEDIDO_PRODUCTO (
    id_pedido NUMBER NOT NULL,
    id_producto NUMBER NOT NULL,
    cantidad NUMBER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMBER(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMBER(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) VIRTUAL,
    PRIMARY KEY (id_pedido, id_producto),
    CONSTRAINT fk_pedprod_pedido FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_pedprod_producto FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto)
);

-- INDICES

CREATE INDEX idx_clientes_telefono ON CLIENTES(telefono);
CREATE INDEX idx_pedidos_estado ON PEDIDOS(estado);
CREATE INDEX idx_pedidos_fecha_programada ON PEDIDOS(fecha_programada);
CREATE INDEX idx_pedidos_cliente ON PEDIDOS(id_cliente);
--CREATE INDEX idx_usuarios_email ON USUARIOS(email); ya indexada al crearse, la dejo por aquello

-- SECUENCIAS 
-- Las hice automaticamente con IDENTITY, pero serian algo asi 
-- CREATE SEQUENCE seq_roles START WITH 1 INCREMENT BY 1;
-- CREATE SEQUENCE seq_usuarios START WITH 1 INCREMENT BY 1;
-- etc...

-- TRIGGERS

-- Trigger para registrar ultimo acceso de usuario
CREATE OR REPLACE TRIGGER trg_usuario_ultimo_acceso
BEFORE UPDATE ON USUARIOS
FOR EACH ROW
BEGIN
    :NEW.ultimo_acceso := CURRENT_TIMESTAMP;
END;
/

-- Trigger para validar stock antes de crear un pedido
CREATE OR REPLACE TRIGGER trg_validar_stock_pedido
BEFORE INSERT ON PEDIDO_PRODUCTO
FOR EACH ROW
DECLARE
    v_stock_disponible NUMBER;
    v_nombre_producto  VARCHAR2(100);
    v_fecha_programada DATE;
BEGIN
    -- Obtener Stock actual d producto
    SELECT stock_actual, nombre
    INTO v_stock_disponible, v_nombre_producto
    FROM PRODUCTOS
    WHERE id_producto = :NEW.id_producto;

    -- Obtener fecha programada del pedido para saber si el pedido es para hoy o para el futuro
    SELECT TRUNC(fecha_programada)
    INTO v_fecha_programada
    FROM PEDIDOS
    WHERE id_pedido = :NEW.id_pedido;
    
    -- Validacion
    -- Solo se bloquea si el pedido es para hoy o antes y no hay stock /  Si es para despues se permite
    IF v_fecha_programada <= TRUNC(SYSDATE) THEN
        IF v_stock_disponible < :NEW.cantidad THEN
            RAISE_APPLICATION_ERROR(-20001,
                'Stock insuficiente para el producto: ' || v_nombre_producto ||
                '. Disponible: ' || v_stock_disponible || ', Solicitado: ' || :NEW.cantidad);
        END IF;
    END IF;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- Manejo de error si el producto o pedido no existen
        RAISE_APPLICATION_ERROR(-20002, 'Error al validar stock: Producto o Pedido no encontrado.');
END;
/

-- TRIGGERS CONTROL DE STOCK AUTOMATICO

-- Trigger para rebajar stock cuando se agrega un producto al pedido
CREATE OR REPLACE TRIGGER trg_rebajar_stock_pedido
AFTER INSERT ON PEDIDO_PRODUCTO
FOR EACH ROW
DECLARE
    v_fecha_programada DATE;
BEGIN
    -- Obtener fecha programada del pedido
    SELECT TRUNC(fecha_programada)
    INTO v_fecha_programada
    FROM PEDIDOS
    WHERE id_pedido = :NEW.id_pedido;
    
    -- Solo rebajar stock si el pedido es para hoy o antes xq para pedidos futuros se produce bajo demanda
    IF v_fecha_programada <= TRUNC(SYSDATE) THEN
        UPDATE PRODUCTOS 
        SET stock_actual = stock_actual - :NEW.cantidad
        WHERE id_producto = :NEW.id_producto;
    END IF;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- Si no encuentra el pedido, no hacer nada
        NULL;
END;
/

-- Trigger para restaurar stock cuando se elimina un producto del pedido
CREATE OR REPLACE TRIGGER trg_restaurar_stock_pedido
AFTER DELETE ON PEDIDO_PRODUCTO
FOR EACH ROW
DECLARE
    v_fecha_programada DATE;
BEGIN
    -- Obtener fecha programada del pedido
    SELECT TRUNC(fecha_programada)
    INTO v_fecha_programada
    FROM PEDIDOS
    WHERE id_pedido = :OLD.id_pedido;
    
    -- Solo restaurar stock si el pedido era para hoy o antes
    IF v_fecha_programada <= TRUNC(SYSDATE) THEN
        UPDATE PRODUCTOS 
        SET stock_actual = stock_actual + :OLD.cantidad
        WHERE id_producto = :OLD.id_producto;
    END IF;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- Si no encuentra el pedido, no hacer nada
        NULL;
END;
/

-- Trigger para ajustar stock cuando se modifica la cantidad de un producto
CREATE OR REPLACE TRIGGER trg_ajustar_stock_pedido
AFTER UPDATE ON PEDIDO_PRODUCTO
FOR EACH ROW
DECLARE
    v_fecha_programada DATE;
    v_diferencia NUMBER;
BEGIN
    -- Solo procesar si cambió la cantidad
    IF :NEW.cantidad != :OLD.cantidad THEN
        -- Obtener fecha programada del pedido
        SELECT TRUNC(fecha_programada)
        INTO v_fecha_programada
        FROM PEDIDOS
        WHERE id_pedido = :NEW.id_pedido;
        
        -- Solo ajustar stock si el pedido es para HOY o antes
        IF v_fecha_programada <= TRUNC(SYSDATE) THEN
            v_diferencia := :NEW.cantidad - :OLD.cantidad;
            
            UPDATE PRODUCTOS 
            SET stock_actual = stock_actual - v_diferencia
            WHERE id_producto = :NEW.id_producto;
        END IF;
    END IF;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- Si no encuentra el pedido, no hacer nada
        NULL;
END;
/