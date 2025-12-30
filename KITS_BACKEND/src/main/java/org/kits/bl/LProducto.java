package org.kits.bl;

import org.kits.db.ConnectionManager;
import org.kits.db.Operations;
import org.kits.dto.Parameter;
import org.kits.entities.Producto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Clase de lógica de negocio para gestión de Productos.
 */
@Component
public class LProducto extends Operations {

    @Autowired
    public LProducto(ConnectionManager connectionManager) {
        super(connectionManager);
    }

    /**
     * Lista todos los productos.
     * 
     * @return Lista de productos
     */
    public ArrayList<Producto> Listar() {
        var productos = new ArrayList<Producto>();
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_PRODUCTOS.sp_op_listar_productos", parameters);
        if (result != null) {
            for (Map<String, Object> row : result) {
                Producto p = new Producto();
                p.setIdProducto(((BigDecimal) row.get("id_producto")).intValue());
                p.setNombre((String) row.get("nombre"));
                p.setDescripcion((String) row.get("descripcion"));
                p.setPrecio(((BigDecimal) row.get("precio")).doubleValue());
                p.setStockActual(((BigDecimal) row.get("stock_actual")).intValue());
                p.setStockMinimo(((BigDecimal) row.get("stock_minimo")).intValue());
                p.setUnidadMedida((String) row.get("unidad_medida"));
                p.setActivo((String) row.get("activo")); // Mapear el campo activo
                productos.add(p);
            }
        }
        return productos;
    }

    /**
     * Consulta un producto por su ID.
     * 
     * @param idProducto ID del producto
     * @return Producto encontrado o null si no existe
     */
    public Producto Consultar(int idProducto) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", idProducto, Types.NUMERIC));
        parameters.add(createResponseParameter());

        List<Map<String, Object>> result = executeQuery("PKG_PRODUCTOS.sp_op_consultar_producto", parameters);
        if (result != null && !result.isEmpty()) {
            Map<String, Object> row = result.getFirst();
            Producto p = new Producto();
            p.setIdProducto(((BigDecimal) row.get("id_producto")).intValue());
            p.setNombre((String) row.get("nombre"));
            p.setDescripcion((String) row.get("descripcion"));
            p.setPrecio(((BigDecimal) row.get("precio")).doubleValue());
            p.setStockActual(((BigDecimal) row.get("stock_actual")).intValue());
            p.setStockMinimo(((BigDecimal) row.get("stock_minimo")).intValue());
            p.setUnidadMedida((String) row.get("unidad_medida"));
            p.setActivo((String) row.get("activo")); // Mapear el campo activo
            return p;
        }
        return null;
    }

    /**
     * Crea o actualiza un producto.
     * 
     * @param producto Datos del producto
     * @return ID del producto creado/actualizado
     */
    public int Guardar(Producto producto) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id", producto.getIdProducto(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_nom", producto.getNombre(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_desc", producto.getDescripcion(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_precio", producto.getPrecio(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_stock", producto.getStockActual(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_min", producto.getStockMinimo(), Types.NUMERIC));
        parameters.add(new Parameter<>("p_uni", producto.getUnidadMedida(), Types.VARCHAR));
        parameters.add(new Parameter<>("p_activo", producto.getActivo(), Types.VARCHAR)); // Nuevo parámetro
        parameters.add(createIntegerResponseParameter());

        return executeWithIntResult("PKG_PRODUCTOS.sp_op_gestionar_producto", parameters);
    }

    /**
     * Ajusta el stock de un producto.
     * 
     * @param idProducto ID del producto
     * @param cantidad   Cantidad a ajustar
     * @param movimiento Tipo de movimiento (ENTRADA/SALIDA)
     */
    public void AjustarStock(int idProducto, int cantidad, String movimiento) {
        var parameters = new ArrayList<Parameter<?>>();
        parameters.add(new Parameter<>("p_id_prod", idProducto, Types.NUMERIC));
        parameters.add(new Parameter<>("p_cant", cantidad, Types.NUMERIC));
        parameters.add(new Parameter<>("p_mov", movimiento, Types.VARCHAR));

        execute("PKG_PRODUCTOS.sp_op_ajustar_stock", parameters);
    }
}
