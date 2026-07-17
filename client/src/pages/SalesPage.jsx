import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  Plus,
  Upload,
  X,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showCSV, setShowCSV] = useState(false);

  // Sale form state
  const [saleItems, setSaleItems] = useState([
    { productId: '', quantity: 1 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const fetchSales = async () => {
    try {
      const res = await api.get('/sales', { params: { page, limit: 15 } });
      setSales(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [page]);

  const handleAddItem = () => {
    setSaleItems([...saleItems, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (saleItems.length === 1) return;
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...saleItems];
    updated[index][field] = field === 'quantity' ? Number(value) : value;
    setSaleItems(updated);
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    const validItems = saleItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      await api.post('/sales', {
        items: validItems,
        paymentMethod,
      });
      toast.success('Sale recorded successfully');
      setShowForm(false);
      setSaleItems([{ productId: '', quantity: 1 }]);
      setPaymentMethod('cash');
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale');
    }
  };

  // CSV Import
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/sales/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setShowCSV(false);
      fetchSales();
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
          <h2 className="page-subtitle">Transaction Log</h2>
        </div>
        <div className="page-header-right">
          <button
            className="btn-secondary"
            onClick={() => setShowCSV(true)}
            id="btn-import-sales"
          >
            <Upload size={16} /> Import CSV
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowForm(true)}
            id="btn-record-sale"
          >
            <Plus size={16} /> Record Sale
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="chart-card">
        <div className="table-container">
          {loading ? (
            <div className="chart-skeleton" style={{ height: 400 }} />
          ) : sales.length > 0 ? (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Profit</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale._id}>
                      <td className="table-cell-primary">
                        {formatDateTime(sale.timestamp)}
                      </td>
                      <td>
                        <div className="sale-items-list">
                          {sale.items.map((item, i) => (
                            <span key={i} className="sale-item-tag">
                              {item.productName} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="table-cell-bold">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="text-green">
                        {formatCurrency(sale.totalAmount - sale.totalCost)}
                      </td>
                      <td>
                        <span className={`payment-badge payment-${sale.paymentMethod}`}>
                          {sale.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <ShoppingCart size={48} className="empty-icon" />
              <h3>No sales recorded</h3>
              <p>Record your first sale or import historical data</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Sale Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Sale</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitSale} className="modal-form">
              <div className="sale-items-form">
                <label>Items</label>
                {saleItems.map((item, index) => (
                  <div key={index} className="sale-item-row">
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        handleItemChange(index, 'productId', e.target.value)
                      }
                      required
                      className="sale-product-select"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — {formatCurrency(p.sellingPrice)} (Stock:{' '}
                          {p.stockLevel})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', e.target.value)
                      }
                      min={1}
                      className="sale-qty-input"
                      placeholder="Qty"
                    />
                    {saleItems.length > 1 && (
                      <button
                        type="button"
                        className="action-btn action-delete"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-text"
                  onClick={handleAddItem}
                >
                  <Plus size={16} /> Add another item
                </button>
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <div className="payment-selector">
                  {['cash', 'card', 'upi'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={`payment-option ${
                        paymentMethod === method ? 'payment-option-active' : ''
                      }`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method.toUpperCase()}
                    </button>
                  ))}
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
                  Record Sale
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
              <h2>Import Sales from CSV</h2>
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
                  Required columns: productName, quantity, priceAtSale,
                  costAtSale, paymentMethod
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
