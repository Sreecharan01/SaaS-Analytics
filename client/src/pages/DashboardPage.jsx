import { useState, useEffect } from 'react';
import api from '../services/api';
import KPIStrip from '../components/dashboard/KPIStrip';
import RevenueChart from '../components/dashboard/RevenueChart';
import TopProductsChart from '../components/dashboard/TopProductsChart';
import PaymentDonut from '../components/dashboard/PaymentDonut';
import LowStockTable from '../components/dashboard/LowStockTable';

const DashboardPage = () => {
  const [kpi, setKpi] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentDist, setPaymentDist] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30D');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const daysMap = { '7D': 7, '30D': 30, '90D': 90 };
      const days = daysMap[period] || 30;
      const startDate = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();

      const periodMap = { '7D': 'daily', '30D': 'daily', '90D': 'weekly' };

      const [kpiRes, trendRes, topRes, paymentRes, stockRes] =
        await Promise.all([
          api.get(`/analytics/kpi?startDate=${startDate}`),
          api.get(
            `/analytics/revenue-trend?period=${periodMap[period]}&startDate=${startDate}`
          ),
          api.get(`/analytics/top-products?limit=5&startDate=${startDate}`),
          api.get(`/analytics/payment-distribution?startDate=${startDate}`),
          api.get('/analytics/low-stock'),
        ]);

      setKpi(kpiRes.data.data);
      setRevenueTrend(trendRes.data.data);
      setTopProducts(topRes.data.data);
      setPaymentDist(paymentRes.data.data);
      setLowStock(stockRes.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  return (
    <div className="dashboard-page">
      <KPIStrip data={kpi} loading={loading} />

      <div className="charts-grid">
        <div className="chart-wide">
          <RevenueChart
            data={revenueTrend}
            loading={loading}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>

        <div className="chart-half">
          <TopProductsChart data={topProducts} loading={loading} />
        </div>

        <div className="chart-half">
          <PaymentDonut data={paymentDist} loading={loading} />
        </div>

        <div className="chart-wide">
          <LowStockTable data={lowStock} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
