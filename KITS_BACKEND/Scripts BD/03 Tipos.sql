-- SCRIPT 03: CREACIÓN DE TIPOS DE DATOS PERSONALIZADOS
-- Tipo de Objeto: Define la estructura de una sola fila de detalle de pedido
CREATE OR REPLACE TYPE t_detalle_pedido AS OBJECT (
    id_producto    NUMBER(10),
    cantidad       NUMBER(5),
    precio         NUMBER(10, 2)
);
/

-- Tipo de Colección: Define la lista de detalles para inserción masiva
CREATE OR REPLACE TYPE t_lista_detalles AS TABLE OF t_detalle_pedido;
/