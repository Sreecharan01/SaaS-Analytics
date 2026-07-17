import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  Plus,
  Search,
  Upload,
  Edit2,
  Trash2,
  X,
  Package,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    stockLevel: 0,
    lowStockThreshold: 10,
    costPrice: 0,
    sellingPrice: 0,
  });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { search } });
      setProducts(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/products', formData);
        toast.success('Product created');
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      stockLevel: product.stockLevel,
      lowStockThreshold: product.lowStockThreshold,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      stockLevel: 0,
      lowStockThreshold: 10,
      costPrice: 0,
      sellingPrice: 0,
    });
  };

  // CSV Import
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formPayload = new FormData();
    formPayload.append('file', file);

    try {
      const res = await api.post('/products/import-csv', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setShowCSV(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV import failed');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="product-search"
            />
          </div>
        </div>
        <div className="page-header-right">
          <button
            className="btn-secondary"
            onClick={() => setShowCSV(true)}
            id="btn-import-products"
          >
            <Upload size={16} /> Import CSV
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              resetForm();
              setEditingProduct(null);
              setShowForm(true);
            }}
            id="btn-add-product"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="chart-card">
        <div className="table-container">
          {loading ? (
            <div className="chart-skeleton" style={{ height: 300 }} />
          ) : products.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Margin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="table-cell-primary">{product.name}</td>
                    <td className="table-cell-mono">{product.sku}</td>
                    <td>
                      <span
                        className={`stock-badge ${
                          product.stockLevel === 0
                            ? 'stock-critical'
                            : product.stockLevel <= product.lowStockThreshold
                            ? 'stock-warning'
                            : 'stock-ok'
                        }`}
                      >
                        {product.stockLevel}
                      </span>
                    </td>
                    <td>{formatCurrency(product.costPrice)}</td>
                    <td>{formatCurrency(product.sellingPrice)}</td>
                    <td className="text-green">
                      {(
                        ((product.sellingPrice - product.costPrice) /
                          product.sellingPrice) *
                        100
                      ).toFixed(1)}
                      %
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn action-edit"
                          onClick={() => handleEdit(product)}
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="action-btn action-delete"
                          onClick={() => handleDelete(product._id)}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Package size={48} className="empty-icon" />
              <h3>No products yet</h3>
              <p>Add your first product or import from CSV</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g. Wireless Mouse"
                  />
                </div>
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    required
                    placeholder="e.g. WM-001"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock Level</label>
                  <input
                    type="number"
                    value={formData.stockLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockLevel: Number(e.target.value),
                      })
                    }
                    min={0}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lowStockThreshold: Number(e.target.value),
                      })
                    }
                    min={0}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cost Price (₹)</label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPrice: Number(e.target.value),
                      })
                    }
                    min={0}
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Selling Price (₹)</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellingPrice: Number(e.target.value),
                      })
                    }
                    min={0}
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCSV && (
        <div className="modal-overlay" onClick={() => setShowCSV(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import Products from CSV</h2>
              <button className="modal-close" onClick={() => setShowCSV(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
              >
                <input {...getInputProps()} />
                <Upload size={40} className="dropzone-icon" />
                <p className="dropzone-text">
                  {isDragActive
                    ? 'Drop the CSV file here...'
                    : 'Drag & drop a CSV file, or click to select'}
                </p>
                <p className="dropzone-hint">
                  Required columns: name, sku, stockLevel, costPrice, sellingPrice
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
