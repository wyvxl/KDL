-- SCRIPT 12: CARGA INICIAL COMPLETA DE DATOS
--
-- ============================================================================
-- ATENCIÓN: este script BORRA TODOS LOS DATOS antes de cargar los de prueba.
-- Es reejecutable a propósito, para dejar la base en un estado conocido cuantas
-- veces haga falta. NO ejecutarlo sobre datos que se quieran conservar.
-- ============================================================================
--
-- Sobre los ids: al recargar, las columnas IDENTITY siguen contando desde donde
-- estaban, así que los roles ya no serán 1-4 sino 5-8, etc. Da igual: la
-- autorización se resuelve por nombre_rol, no por id (ver JwtAuthFilter).
--
-- Sobre el stock: los pedidos que se crean aquí en estado EN_PROCESO, LISTO o
-- ENTREGADO descuentan inventario al crearse (sp_crear_pedido_completo llama a
-- sp_sincronizar_stock_pedido). Los PENDIENTE y CANCELADO no. Las cantidades
-- están calculadas para que ningún producto quede en negativo.

SET SERVEROUTPUT ON;

-- ==============================================================================
-- 0. LIMPIEZA
--
-- En orden inverso a las claves foráneas: detalle -> pedidos -> catálogos ->
-- usuarios -> roles. Sin esto, una segunda corrida falla en UNIQUE(nombre_rol)
-- y duplicaría clientes, productos y pedidos, que no tienen clave única.
-- ==============================================================================
BEGIN
    DELETE FROM PEDIDO_PRODUCTO;
    DELETE FROM PEDIDOS;
    DELETE FROM PRODUCTOS;
    DELETE FROM CLIENTES;
    DELETE FROM USUARIOS;
    DELETE FROM ROLES;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('>>> Datos anteriores eliminados. <<<');
END;
/

DECLARE
    -- Variables para almacenar IDs generados de ROLES
    v_id_rol_admin      NUMBER;
    v_id_rol_repartidor NUMBER;
    v_id_rol_panadero   NUMBER;
    v_id_rol_vendedor   NUMBER; -- Rol adicional para pruebas

    -- Variables para Usuarios, Clientes, Productos y Pedidos
    v_id_user_admin     NUMBER;
    v_id_user_repartidor NUMBER;
    v_id_user_panadero  NUMBER;
    v_id_user_vendedor  NUMBER;
    
    v_id_cli_1 NUMBER; v_id_cli_2 NUMBER; v_id_cli_3 NUMBER; v_id_cli_4 NUMBER; v_id_cli_5 NUMBER;
    v_id_prod_1 NUMBER; v_id_prod_2 NUMBER; v_id_prod_3 NUMBER; v_id_prod_4 NUMBER; v_id_prod_5 NUMBER;
    v_id_pedido NUMBER;

    -- Variable tipo tabla para detalles de pedido
    v_detalles t_lista_detalles;

BEGIN
    DBMS_OUTPUT.PUT_LINE('>>> INICIANDO CARGA INICIAL COMPLETA DE DATOS <<<');

    -- ==============================================================================
    -- 1. ROLES Y USUARIOS (Creación de los 4 roles principales)
    -- ==============================================================================
    DBMS_OUTPUT.PUT_LINE('-- Creando Roles...');
    
    -- 1. ADMIN (Rol principal)
    PKG_ROLES.sp_op_crear_rol('ADMIN', 'Administrador principal del sistema', v_id_rol_admin);
    DBMS_OUTPUT.PUT_LINE('Rol ADMIN creado con ID: ' || v_id_rol_admin);
    
    -- 2. REPARTIDOR
    PKG_ROLES.sp_op_crear_rol('REPARTIDOR', 'Encargado de la distribución y entrega de pedidos', v_id_rol_repartidor);
    DBMS_OUTPUT.PUT_LINE('Rol REPARTIDOR creado con ID: ' || v_id_rol_repartidor);
    
    -- 3. PANADERO
    PKG_ROLES.sp_op_crear_rol('PANADERO', 'Encargado de la producción y gestión de inventario', v_id_rol_panadero);
    DBMS_OUTPUT.PUT_LINE('Rol PANADERO creado con ID: ' || v_id_rol_panadero);
    
    -- 4. VENDEDOR (Rol adicional para facilitar la creación de pedidos de prueba)
    PKG_ROLES.sp_op_crear_rol('VENDEDOR', 'Encargado de mostrador y toma de pedidos', v_id_rol_vendedor);
    DBMS_OUTPUT.PUT_LINE('Rol VENDEDOR creado con ID: ' || v_id_rol_vendedor);
    
    
    -- Creando Usuarios
    DBMS_OUTPUT.PUT_LINE('-- Creando Usuarios...');
    
    -- Usuario 1: ADMIN (Acceso total)
    PKG_USUARIOS.sp_op_gestionar_usuario(NULL, v_id_rol_admin, 'admin', '1234', 'admin@kitsdeluz.com', 'Administrador General', v_id_user_admin);
    DBMS_OUTPUT.PUT_LINE('Usuario Admin creado con ID: ' || v_id_user_admin);
    
    -- Usuario 2: REPARTIDOR (Prueba)
    PKG_USUARIOS.sp_op_gestionar_usuario(NULL, v_id_rol_repartidor, 'repartidor', '1234', 'reparto@kitsdeluz.com', 'Juan Repartidor', v_id_user_repartidor);
    DBMS_OUTPUT.PUT_LINE('Usuario Repartidor creado con ID: ' || v_id_user_repartidor);

    -- Usuario 3: PANADERO (Prueba)
    PKG_USUARIOS.sp_op_gestionar_usuario(NULL, v_id_rol_panadero, 'panadero', '1234', 'produccion@kitsdeluz.com', 'Maria Panadera', v_id_user_panadero);
    DBMS_OUTPUT.PUT_LINE('Usuario Panadero creado con ID: ' || v_id_user_panadero);

    -- Usuario 4: VENDEDOR (Responsable de pedidos de prueba)
    PKG_USUARIOS.sp_op_gestionar_usuario(NULL, v_id_rol_vendedor, 'vendedor', '1234', 'vendedor@kitsdeluz.com', 'Carlos Vendedor', v_id_user_vendedor);
    DBMS_OUTPUT.PUT_LINE('Usuario Vendedor creado con ID: ' || v_id_user_vendedor);

    -- ==============================================================================
    -- 2. CLIENTES (Datos variados para pruebas completas)
    -- ==============================================================================
    DBMS_OUTPUT.PUT_LINE('-- Creando Clientes...');
    PKG_CLIENTES.sp_op_gestionar_cliente(NULL, 'Restaurante La Casona', '2222-5555', 'San José, Centro', 'contacto@lacasona.cr', 'Cliente VIP - Descuento 10%', v_id_cli_1);
    PKG_CLIENTES.sp_op_gestionar_cliente(NULL, 'Cafetería El Grano', '8888-1111', 'Heredia, cerca de la UNA', 'info@elgrano.com', 'Pide factura electrónica', v_id_cli_2);
    PKG_CLIENTES.sp_op_gestionar_cliente(NULL, 'Hotel Playa Bonita', '2600-9999', 'Puntarenas, Paseo Turistas', 'compras@playabonita.com', 'Entregas solo lunes', v_id_cli_3);
    PKG_CLIENTES.sp_op_gestionar_cliente(NULL, 'Ana María Campos', '7050-3030', 'Alajuela, El Coyol', 'ana.m@gmail.com', 'Cliente individual frecuente', v_id_cli_4);
    PKG_CLIENTES.sp_op_gestionar_cliente(NULL, 'Panadería Los Abuelos', '2440-2020', 'Cartago, Paraíso', 'pedidos@abuelos.com', 'Competencia/Aliado comercial', v_id_cli_5);

    -- ==============================================================================
    -- 3. PRODUCTOS (Catálogo completo para pruebas)
    -- ==============================================================================
    DBMS_OUTPUT.PUT_LINE('-- Creando Productos...');
    PKG_PRODUCTOS.sp_op_gestionar_producto(NULL, 'Baguette Artesanal', 'Pan francés de masa madre', 1200, 50, 10, 'UNIDAD', 'S', v_id_prod_1);
    PKG_PRODUCTOS.sp_op_gestionar_producto(NULL, 'Croissant de Mantequilla', 'Hojaldre 100% mantequilla', 1800, 30, 5, 'UNIDAD', 'S', v_id_prod_2);
    PKG_PRODUCTOS.sp_op_gestionar_producto(NULL, 'Queque Seco Naranja', 'Barra de queque casero', 4500, 15, 3, 'UNIDAD', 'S', v_id_prod_3);
    PKG_PRODUCTOS.sp_op_gestionar_producto(NULL, 'Empanada de Pollo', 'Horneada, no frita', 950, 100, 20, 'UNIDAD', 'S', v_id_prod_4);
    PKG_PRODUCTOS.sp_op_gestionar_producto(NULL, 'Café Molido Tarrazú', 'Bolsa de 500gr premium', 5500, 20, 5, 'BOLSA', 'S', v_id_prod_5);
    
    -- Ajuste de Stock (Para probar sp_ajustar_stock)
    PKG_PRODUCTOS.sp_op_ajustar_stock(v_id_prod_1, 5, 'SALIDA'); -- Stock 50 -> 45
    PKG_PRODUCTOS.sp_op_ajustar_stock(v_id_prod_2, 10, 'ENTRADA'); -- Stock 30 -> 40

    -- ==============================================================================
    -- 4. PEDIDOS (Escenarios completos de prueba)
    -- ==============================================================================
    -- NOTA: sp_op_crear_pedido_completo recibe la cabecera Y los detalles en una sola
    -- llamada (a diferencia de un diseño anterior con sp_op_crear_pedido +
    -- sp_op_gestionar_productos_pedido, que ya no existen en PKG_PEDIDOS).
    DBMS_OUTPUT.PUT_LINE('-- Creando Pedidos con diferentes estados...');

    -- PEDIDO 1: Entregado (Cliente 1, Pagado) -> descuenta stock al crearse
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_1, 1, 1200), -- 1x Baguette Artesanal
        t_detalle_pedido(v_id_prod_4, 5, 950)   -- 5x Empanada de Pollo
    );
    PKG_PEDIDOS.sp_op_crear_pedido_completo(
        p_id => NULL, p_cli => v_id_cli_1, p_usu => v_id_user_vendedor,
        p_fecha => SYSDATE - 1, p_estado => 'ENTREGADO', p_pagado => 'S',
        p_detalles => v_detalles, p_res => v_id_pedido
    );

    -- PEDIDO 2: Pendiente (Cliente 2, para hoy)
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_2, 3, 1800), -- 3x Croissant
        t_detalle_pedido(v_id_prod_3, 1, 4500)  -- 1x Queque Seco Naranja
    );
    PKG_PEDIDOS.sp_op_crear_pedido_completo(
        p_id => NULL, p_cli => v_id_cli_2, p_usu => v_id_user_vendedor,
        p_fecha => SYSDATE, p_estado => 'PENDIENTE', p_pagado => 'N',
        p_detalles => v_detalles, p_res => v_id_pedido
    );

    -- PEDIDO 3: En Proceso (Cliente 3, para futuro)
    -- Caso clave del modelo nuevo: pedido para dentro de 5 días que YA fue tomado
    -- por cocina, así que su stock sí está descontado.
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_4, 15, 950),
        t_detalle_pedido(v_id_prod_5, 2, 5500)
    );
    PKG_PEDIDOS.sp_op_crear_pedido_completo(
        p_id => NULL, p_cli => v_id_cli_3, p_usu => v_id_user_vendedor,
        p_fecha => SYSDATE + 5, p_estado => 'EN_PROCESO', p_pagado => 'S',
        p_detalles => v_detalles, p_res => v_id_pedido
    );

    -- PEDIDO 4: Cancelado (Cliente 4) -> no descuenta stock
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_1, 2, 1200)
    );
    PKG_PEDIDOS.sp_op_crear_pedido_completo(
        p_id => NULL, p_cli => v_id_cli_4, p_usu => v_id_user_vendedor,
        p_fecha => SYSDATE - 2, p_estado => 'CANCELADO', p_pagado => 'N',
        p_detalles => v_detalles, p_res => v_id_pedido
    );

    -- PEDIDO 5: Listo para entregar (Cliente 1 de nuevo)
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_2, 10, 1800),
        t_detalle_pedido(v_id_prod_5, 1, 5500)
    );
    PKG_PEDIDOS.sp_op_crear_pedido_completo(
        p_id => NULL, p_cli => v_id_cli_1, p_usu => v_id_user_vendedor,
        p_fecha => SYSDATE, p_estado => 'LISTO', p_pagado => 'N',
        p_detalles => v_detalles, p_res => v_id_pedido
    );
    
    DBMS_OUTPUT.PUT_LINE('>>> CARGA INICIAL COMPLETA FINALIZADA EXITOSAMENTE <<<');
    DBMS_OUTPUT.PUT_LINE('Sistema listo con: 4 roles, 4 usuarios, 5 clientes, 5 productos, 5 pedidos');
    
    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('!!! ERROR DURANTE LA CARGA DE DATOS !!!');
        DBMS_OUTPUT.PUT_LINE('SQLCODE: ' || SQLCODE || ', SQLERRM: ' || SQLERRM);
        -- No se hace ROLLBACK: cada sp_* hace COMMIT internamente, así que lo ya
        -- insertado no se puede deshacer desde aquí. Antes había uno y daba la falsa
        -- impresión de que la carga era atómica. La forma de recuperarse de un fallo
        -- a medias es volver a ejecutar el script: la limpieza inicial se encarga.
        --
        -- Se relanza para que el error llegue a la herramienta: si solo se imprimiera,
        -- una carga fallida pasaría desapercibida entre la salida de DBMS_OUTPUT.
        RAISE;
END;
/