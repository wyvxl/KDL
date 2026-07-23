import React, { useState, useEffect } from 'react';
import { productoService } from '../../services/productoService';
import type { Producto } from './';
import { ProductModal, StockAdjustmentModal } from '../../components/modals';
import { AlertTriangle } from 'lucide-react';
import './Products.css';

/**
 * Página de Gestión de Productos.
 * Permite listar, crear, editar y ajustar el stock de productos.
 */
const Products: React.FC = () => {
    // Estados de datos y carga
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para modales (Producto y Stock)
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedProductForStock, setSelectedProductForStock] = useState<Producto | null>(null);

    // Estados de filtrado
    const [busqueda, setBusqueda] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('TODOS'); // Nuevo estado para el filtro de activo
    const [mostrarBusqueda, setMostrarBusqueda] = useState<boolean>(false);

    /**
     * Carga la lista completa de productos desde el backend.
     */
    const loadProductos = async () => {
        try {
            setLoading(true);
            const data = await productoService.listar();

            if (Array.isArray(data)) {
                setProductos(data);
            } else {
                console.error('Data received is not an array:', data);
                setProductos([]);
                setError('Error: Los datos recibidos no tienen el formato correcto.');
            }
        } catch (err) {
            console.error('Error loading productos:', err);
            setError('No se pudieron cargar los productos. Verifique la conexión con el backend.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial al montar (loadProductos gestiona el estado de carga)
        void loadProductos();
    }, []);

    // Funciones de gestión del Modal de Producto (Crear/Editar)
    const handleNewProduct = () => {
        setEditingProduct(null);
        setShowModal(true);
    };

    const handleEditProduct = (producto: Producto) => {
        setEditingProduct(producto);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const handleProductAdded = () => {
        void loadProductos();
    };

    // Funciones de gestión del Modal de Stock (Ajustes rápidos)
    const handleOpenStockModal = (producto: Producto) => {
        setSelectedProductForStock(producto);
        setShowStockModal(true);
    };

    const handleCloseStockModal = () => {
        setShowStockModal(false);
        setSelectedProductForStock(null);
    };

    const handleStockAdjusted = () => {
        void loadProductos();
    };

    /**
     * Filtra los productos según el término de búsqueda y el estado activo.
     */
    const getProductosFiltrados = () => {
        let productosFiltrados = [...productos];

        // Filtrar por término de búsqueda
        if (busqueda.trim()) {
            productosFiltrados = productosFiltrados.filter(producto =>
                producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
        }

        // Filtrar por estado activo
        if (statusFilter !== 'TODOS') {
            productosFiltrados = productosFiltrados.filter(producto => producto.activo === statusFilter);
        }

        return productosFiltrados;
    };

    if (loading) return <div>Cargando productos...</div>;

    const productosFiltrados = getProductosFiltrados();
    const hasProducts = Array.isArray(productosFiltrados) && productosFiltrados.length > 0;

    return (
        <div className="products-page">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>Productos</h1>
                    {/* Toggle Búsqueda */}
                    <button
                        onClick={() => setMostrarBusqueda(!mostrarBusqueda)}
                        className="btn btn-secondary"
                        style={{
                            padding: '0.5rem', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Buscar producto"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                </div>
                {/* Nuevo Producto */}
                <button
                    className="btn btn-primary"
                    onClick={handleNewProduct}
                >
                    + Nuevo Producto
                </button>
            </div>

            {/* Barra de Búsqueda y Filtros */}
            {mostrarBusqueda && (
                <div style={{
                    marginBottom: '1.5rem', padding: '1rem',
                    backgroundColor: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)',
                    display: 'flex', gap: '1rem' // Añadido para alinear filtros
                }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Buscar por nombre
                        </label>
                        <input
                            type="text"
                            placeholder="Escribe el nombre del producto..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)', backgroundColor: 'white', fontSize: '1rem'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Filtrar por Estado
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '6px',
                                border: '1px solid var(--border-color)', backgroundColor: 'white', fontSize: '1rem'
                            }}
                        >
                            <option value="TODOS">Todos</option>
                            <option value="S">Activos</option>
                            <option value="N">Inactivos</option>
                        </select>
                    </div>
                </div>
            )}

            {/* ERROR CARD */}
            {error && (
                <div style={{
                    backgroundColor: '#fef3c7', color: '#92400e', padding: '0.75rem',
                    borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fcd34d'
                }}>
                    {error}
                </div>
            )}

            {/* GRID DE PRODUCTOS */}
            <div className="products-grid">
                {!hasProducts ? (
                    <p className="empty-state">
                        {busqueda || statusFilter !== 'TODOS' ? 'No se encontraron productos con los filtros aplicados.' : 'No hay productos cargados.'}
                    </p>
                ) : (
                    productosFiltrados.map((producto, index) => (
                        <div key={producto.idProducto || index} className="product-card">
                            <div className="product-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h3>{producto.nombre}</h3>
                                    {producto.stockActual <= producto.stockMinimo && (
                                        <div title="Stock Bajo" style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                                            <AlertTriangle size={20} />
                                        </div>
                                    )}
                                </div>
                                {producto.activo === 'N' && ( // <-- Aviso de inactivo
                                    <span style={{
                                        backgroundColor: '#ef4444', // Rojo
                                        color: 'white',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        marginLeft: '0.5rem'
                                    }}>
                                        INACTIVO
                                    </span>
                                )}
                            </div>
                            <div className="product-description">
                                {producto.descripcion}
                            </div>
                            <div className="product-info">
                                <div className="info-row">
                                     <span className="price">₡{producto.precio.toFixed(2)}</span>
                                </div>
                                <div className="info-row">
                                    <span>Stock: {producto.stockActual}</span>
                                </div>
                                <div className="info-row">
                                    <span>Stock Mínimo: {producto.stockMinimo}</span>
                                </div>
                                <div className="info-row">
                                    <span>Unidad: {producto.unidadMedida}</span>
                                </div>
                            </div>
                            <div className="product-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handleOpenStockModal(producto)}
                                    title="Ajustar Stock"
                                    style={{ flex: 1 }}
                                >
                                    +/- Stock
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handleEditProduct(producto)}
                                    style={{ flex: 1 }}
                                >
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modales */}
            <ProductModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onProductAdded={handleProductAdded}
                product={editingProduct}
            />

            <StockAdjustmentModal
                isOpen={showStockModal}
                onClose={handleCloseStockModal}
                onSuccess={handleStockAdjusted}
                producto={selectedProductForStock}
            />
        </div>
    );
};

export default Products;
