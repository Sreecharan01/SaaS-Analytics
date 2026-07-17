import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{data.productName}</p>
        <p className="chart-tooltip-value" style={{ color: '#6366f1' }}>
          Revenue: {formatCurrency(data.totalRevenue)}
        </p>
        <p className="chart-tooltip-value" style={{ color: '#22c55e' }}>
          Profit: {formatCurrency(data.totalProfit)}
        </p>
        <p className="chart-tooltip-value" style={{ color: '#94a3b8' }}>
          Sold: {data.totalQuantitySold} units
        </p>
      </div>
    );
  }
  return null;
};

const TopProductsChart = ({ data, loading }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Top 5 Products</h3>
        <span className="chart-subtitle">By Revenue</span>
      </div>

      <div className="chart-body">
        {loading ? (
          <div className="chart-skeleton" />
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
              />
              <YAxis
                type="category"
                dataKey="productName"
                stroke="#64748b"
                fontSize={12}
                width={100}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
              <Bar dataKey="totalRevenue" radius={[0, 6, 6, 0]} barSize={28}>
                {(data || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            <p>No product data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopProductsChart;
