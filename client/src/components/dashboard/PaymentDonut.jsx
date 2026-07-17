import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = {
  cash: '#22c55e',
  card: '#6366f1',
  upi: '#f59e0b',
};

const LABELS = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{LABELS[data.method] || data.method}</p>
        <p className="chart-tooltip-value">
          {formatCurrency(data.totalAmount)}
        </p>
        <p className="chart-tooltip-value" style={{ color: '#94a3b8' }}>
          {data.percentage}% of transactions
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => {
  return (
    <div className="donut-legend">
      {payload.map((entry, index) => (
        <div key={index} className="donut-legend-item">
          <span
            className="donut-legend-dot"
            style={{ backgroundColor: entry.color }}
          />
          <span className="donut-legend-label">
            {LABELS[entry.value] || entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const PaymentDonut = ({ data, loading }) => {
  const chartData = (data || []).map((d) => ({
    ...d,
    name: d.method,
    value: d.count,
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Payment Split</h3>
        <span className="chart-subtitle">By Method</span>
      </div>

      <div className="chart-body">
        {loading ? (
          <div className="chart-skeleton" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.method] || '#64748b'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            <p>No payment data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDonut;
