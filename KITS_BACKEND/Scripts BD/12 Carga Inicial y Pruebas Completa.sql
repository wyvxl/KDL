-- SCRIPT 12: CARGA INICIAL COMPLETA DE DATOS

SET SERVEROUTPUT ON;

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
    PKG_PRODUCTOS.sp_op_ajustar_stock(v_id_prod_1, 5, 'SALIDA'); -- Stock 10 -> 5
    PKG_PRODUCTOS.sp_op_ajustar_stock(v_id_prod_2, 10, 'ENTRADA'); -- Stock 50 -> 60

    -- ==============================================================================
    -- 4. PEDIDOS (Escenarios completos de prueba)
    -- ==============================================================================
    DBMS_OUTPUT.PUT_LINE('-- Creando Pedidos con diferentes estados...');

    -- PEDIDO 1: Entregado (Cliente 1, Pagado)
    PKG_PEDIDOS.sp_op_crear_pedido(NULL, v_id_cli_1, v_id_user_vendedor, SYSDATE - 1, 'ENTREGADO', 'S', v_id_pedido);
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_1, 1, 3500), -- 1x Pan de Masa Madre
        t_detalle_pedido(v_id_prod_4, 5, 1200)  -- 5x Baguette
    );
    PKG_PEDIDOS.sp_op_gestionar_productos_pedido(v_id_pedido, v_detalles);
    
    -- PEDIDO 2: Pendiente (Cliente 2, para hoy)
    PKG_PEDIDOS.sp_op_crear_pedido(NULL, v_id_cli_2, v_id_user_vendedor, SYSDATE, 'PENDIENTE', 'N', v_id_pedido);
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_2, 3, 1800), -- 3x Croissant
        t_detalle_pedido(v_id_prod_3, 1, 12500) -- 1x Kits de Postre
    );
    PKG_PEDIDOS.sp_op_gestionar_productos_pedido(v_id_pedido, v_detalles);
    
    -- PEDIDO 3: En Proceso (Cliente 3, para futuro)
    PKG_PEDIDOS.sp_op_crear_pedido(NULL, v_id_cli_3, v_id_user_vendedor, SYSDATE + 5, 'EN_PROCESO', 'S', v_id_pedido);
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_4, 15, 1200),
        t_detalle_pedido(v_id_prod_5, 2, 5500)
    );
    PKG_PEDIDOS.sp_op_gestionar_productos_pedido(v_id_pedido, v_detalles);

    -- PEDIDO 4: Cancelado (Cliente 4)
    PKG_PEDIDOS.sp_op_crear_pedido(NULL, v_id_cli_4, v_id_user_vendedor, SYSDATE - 2, 'CANCELADO', 'N', v_id_pedido);
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_1, 2, 3500)
    );
    PKG_PEDIDOS.sp_op_gestionar_productos_pedido(v_id_pedido, v_detalles);

    -- PEDIDO 5: Listo para entregar (Cliente 1 de nuevo)
    PKG_PEDIDOS.sp_op_crear_pedido(NULL, v_id_cli_1, v_id_user_vendedor, SYSDATE, 'LISTO', 'N', v_id_pedido);
    v_detalles := t_lista_detalles(
        t_detalle_pedido(v_id_prod_2, 10, 1800),
        t_detalle_pedido(v_id_prod_5, 1, 5500)
    );
    PKG_PEDIDOS.sp_op_gestionar_productos_pedido(v_id_pedido, v_detalles);
    
    DBMS_OUTPUT.PUT_LINE('>>> CARGA INICIAL COMPLETA FINALIZADA EXITOSAMENTE <<<');
    DBMS_OUTPUT.PUT_LINE('Sistema listo con: 4 roles, 4 usuarios, 5 clientes, 5 productos, 5 pedidos');
    
    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('!!! ERROR DURANTE LA CARGA DE DATOS !!!');
        DBMS_OUTPUT.PUT_LINE('SQLCODE: ' || SQLCODE || ', SQLERRM: ' || SQLERRM);
        ROLLBACK;
END;
/