import { AlertTriangle } from 'lucide-react';

const LowStockTable = ({ data, loading }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">
          <AlertTriangle size={18} className="text-amber-400" />
          Low Stock Alerts
        </h3>
        <span className="chart-subtitle">{data?.length || 0} items</span>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="chart-skeleton" />
        ) : data && data.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product) => (
                <tr key={product._id}>
                  <td className="table-cell-primary">{product.name}</td>
                  <td className="table-cell-mono">{product.sku}</td>
                  <td>
                    <span
                      className={`stock-badge ${
                        product.stockLevel === 0
                          ? 'stock-critical'
                          : 'stock-warning'
                      }`}
                    >
                      {product.stockLevel}
                    </span>
                  </td>
                  <td>{product.lowStockThreshold}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        product.stockLevel === 0
                          ? 'status-badge-critical'
                          : 'status-badge-warning'
                      }`}
                    >
                      {product.stockLevel === 0 ? 'OUT OF STOCK' : 'LOW'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="chart-empty">
            <p>All products are well-stocked 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockTable;
