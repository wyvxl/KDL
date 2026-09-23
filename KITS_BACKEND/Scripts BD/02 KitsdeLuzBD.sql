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
    -- Indica si los productos de este pedido ya salieron del inventario.
    -- Invariante: 'S' <=> estado IN ('EN_PROCESO','LISTO','ENTREGADO').
    -- Hace idempotente la aplicación/reversión de stock (ver sp_sincronizar_stock_pedido).
    stock_aplicado CHAR(1) DEFAULT 'N' CHECK (stock_aplicado IN ('S', 'N')),
    -- Quién hizo el último cambio de estado (cocina, reparto...). Va aparte de
    -- id_usuario_responsable para no perder al vendedor que tomó el pedido.
    id_usuario_ultimo_cambio NUMBER,
    CONSTRAINT fk_pedidos_clientes FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente),
    CONSTRAINT fk_pedidos_usuarios FOREIGN KEY (id_usuario_responsable) REFERENCES USUARIOS(id_usuario),
    CONSTRAINT fk_pedidos_usuario_cambio FOREIGN KEY (id_usuario_ultimo_cambio) REFERENCES USUARIOS(id_usuario)
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
--
-- Este esquema no usa triggers. Las dos cosas que antes se hacían con ellos se
-- movieron a los procedimientos, porque desde el trigger no había forma de
-- distinguir qué operación las estaba disparando.

-- ULTIMO ACCESO DE USUARIO
--
-- Antes lo ponía un trigger BEFORE UPDATE ON USUARIOS. No funcionaba: autenticarse
-- es un SELECT, así que un login nunca lo actualizaba. Lo que sí lo actualizaba era
-- cualquier otro UPDATE (editar el usuario, cambiarle la contraseña, desactivarlo),
-- con lo que la columna acababa siendo "última modificación" con nombre equivocado.
--
-- Ahora lo registra sp_autenticar_usuario (script 04), y solo cuando las credenciales
-- son correctas.

-- CONTROL DE STOCK
--
-- El stock NO se maneja con triggers sobre PEDIDO_PRODUCTO. Se hacía así antes,
-- condicionado a "fecha_programada <= SYSDATE", y tenía dos problemas:
--
--   1. Un pedido para mañana o para la otra semana nunca descontaba stock. Ni al
--      crearse, ni al llegar el día (no hay nada que se ejecute ese día), ni al
--      entregarse. Se entregaba el producto y el inventario seguía intacto.
--   2. Al tomar el pedido no se puede saber si habrá stock: para el jueves se
--      hornea el jueves. Validar contra el inventario de hoy no tiene sentido.
--
-- Modelo actual: el stock sale del inventario cuando COCINA TOMA EL PEDIDO,
-- es decir cuando pasa de PENDIENTE a EN_PROCESO. Da igual si el pedido es para
-- hoy o para dentro de un mes: se descuenta contra el stock que exista ese día.
--
-- Ver sp_aplicar_stock_pedido / sp_revertir_stock_pedido / sp_sincronizar_stock_pedido
-- en el script 06. La columna PEDIDOS.stock_aplicado garantiza que se aplique
-- una sola vez.