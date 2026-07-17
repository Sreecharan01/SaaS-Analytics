import { useEffect, useState, useRef } from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
} from 'lucide-react';

const AnimatedCounter = ({ value, formatter, duration = 1200 }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(startValue + (value - startValue) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span>{formatter ? formatter(display) : formatNumber(display)}</span>;
};

const KPIStrip = ({ data, loading }) => {
  const cards = [
    {
      id: 'kpi-revenue',
      label: 'Gross Revenue',
      value: data?.totalRevenue || 0,
      formatter: formatCurrency,
      icon: DollarSign,
      gradient: 'kpi-gradient-blue',
      iconBg: 'kpi-icon-blue',
    },
    {
      id: 'kpi-profit',
      label: 'Net Profit',
      value: data?.grossProfit || 0,
      formatter: formatCurrency,
      icon: TrendingUp,
      gradient: 'kpi-gradient-green',
      iconBg: 'kpi-icon-green',
    },
    {
      id: 'kpi-ticket',
      label: 'Avg Ticket Value',
      value: data?.avgTicketValue || 0,
      formatter: formatCurrency,
      icon: Receipt,
      gradient: 'kpi-gradient-violet',
      iconBg: 'kpi-icon-violet',
    },
    {
      id: 'kpi-stock',
      label: 'Low Stock Alerts',
      value: data?.lowStockCount || 0,
      formatter: (v) => Math.round(v).toString(),
      icon: AlertTriangle,
      gradient: 'kpi-gradient-amber',
      iconBg: 'kpi-icon-amber',
    },
  ];

  return (
    <div className="kpi-strip">
      {cards.map((card) => (
        <div key={card.id} id={card.id} className={`kpi-card ${card.gradient}`}>
          {loading ? (
            <div className="kpi-skeleton">
              <div className="skeleton-line skeleton-sm" />
              <div className="skeleton-line skeleton-lg" />
            </div>
          ) : (
            <>
              <div className="kpi-card-header">
                <span className="kpi-label">{card.label}</span>
                <div className={`kpi-icon ${card.iconBg}`}>
                  <card.icon size={20} />
                </div>
              </div>
              <div className="kpi-value">
                <AnimatedCounter
                  value={card.value}
                  formatter={card.formatter}
                />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPIStrip;
