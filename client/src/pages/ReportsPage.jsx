import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { FileText, Download, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const { business } = useAuth();
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [kpiRes, topRes, paymentRes, salesRes] = await Promise.all([
        api.get(`/analytics/kpi?startDate=${startDate}&endDate=${endDate}`),
        api.get(
          `/analytics/top-products?limit=10&startDate=${startDate}&endDate=${endDate}`
        ),
        api.get(
          `/analytics/payment-distribution?startDate=${startDate}&endDate=${endDate}`
        ),
        api.get(
          `/sales?startDate=${startDate}&endDate=${endDate}&limit=100`
        ),
      ]);

      setReportData({
        kpi: kpiRes.data.data,
        topProducts: topRes.data.data,
        paymentDist: paymentRes.data.data,
        sales: salesRes.data.data,
      });
    } catch (err) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!reportData) {
      toast.error('Please generate a preview first');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ─── Header ───
    doc.setFillColor(99, 102, 241); // Indigo
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Report', 14, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${business?.storeName || 'Business'} — ${formatDate(startDate)} to ${formatDate(endDate)}`,
      14,
      30
    );

    // ─── KPI Summary ───
    doc.setTextColor(30, 41, 59);
    let y = 52;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Performance Indicators', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', formatCurrency(reportData.kpi.totalRevenue)],
        ['Gross Profit', formatCurrency(reportData.kpi.grossProfit)],
        [
          'Avg Ticket Value',
          formatCurrency(reportData.kpi.avgTicketValue),
        ],
        ['Total Transactions', reportData.kpi.transactionCount.toString()],
        [
          'Profit Margin',
          reportData.kpi.totalRevenue > 0
            ? (
                (reportData.kpi.grossProfit / reportData.kpi.totalRevenue) *
                100
              ).toFixed(1) + '%'
            : '0%',
        ],
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 10 },
    });

    // ─── Top Products ───
    y = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Products by Revenue', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Product', 'Revenue', 'Profit', 'Units Sold']],
      body: reportData.topProducts.map((p) => [
        p.productName,
        formatCurrency(p.totalRevenue),
        formatCurrency(p.totalProfit),
        p.totalQuantitySold.toString(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 10 },
    });

    // ─── Payment Distribution ───
    y = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method Distribution', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Method', 'Transactions', 'Amount', 'Percentage']],
      body: reportData.paymentDist.map((p) => [
        p.method.toUpperCase(),
        p.count.toString(),
        formatCurrency(p.totalAmount),
        p.percentage + '%',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 10 },
    });

    // ─── Footer ───
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated on ${new Date().toLocaleString()} — SaaS Analytics Dashboard`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 30,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    // Save
    doc.save(
      `Financial_Report_${startDate}_to_${endDate}.pdf`
    );
    toast.success('PDF report downloaded!');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-subtitle">Financial Reports</h2>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="chart-card">
        <div className="report-controls">
          <div className="date-range-picker">
            <div className="form-group">
              <label>
                <Calendar size={14} /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                id="report-start-date"
              />
            </div>
            <div className="form-group">
              <label>
                <Calendar size={14} /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                id="report-end-date"
              />
            </div>
          </div>
          <div className="report-actions">
            <button
              className="btn-secondary"
              onClick={fetchReportData}
              disabled={loading}
              id="btn-preview-report"
            >
              {loading ? 'Loading...' : 'Generate Preview'}
            </button>
            <button
              className="btn-primary"
              onClick={generatePDF}
              disabled={!reportData}
              id="btn-download-pdf"
            >
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="report-preview">
          {/* KPI Preview */}
          <div className="chart-card">
            <h3 className="chart-title" style={{ padding: '20px 24px 0' }}>
              <FileText size={18} /> Key Performance Indicators
            </h3>
            <div className="table-container">
              <table className="data-table">
                <tbody>
                  <tr>
                    <td className="table-cell-primary">Total Revenue</td>
                    <td className="table-cell-bold">
                      {formatCurrency(reportData.kpi.totalRevenue)}
                    </td>
                  </tr>
                  <tr>
                    <td className="table-cell-primary">Gross Profit</td>
                    <td className="text-green table-cell-bold">
                      {formatCurrency(reportData.kpi.grossProfit)}
                    </td>
                  </tr>
                  <tr>
                    <td className="table-cell-primary">Avg Ticket Value</td>
                    <td className="table-cell-bold">
                      {formatCurrency(reportData.kpi.avgTicketValue)}
                    </td>
                  </tr>
                  <tr>
                    <td className="table-cell-primary">Transactions</td>
                    <td className="table-cell-bold">
                      {reportData.kpi.transactionCount}
                    </td>
                  </tr>
                  <tr>
                    <td className="table-cell-primary">Profit Margin</td>
                    <td className="text-green table-cell-bold">
                      {reportData.kpi.totalRevenue > 0
                        ? (
                            (reportData.kpi.grossProfit /
                              reportData.kpi.totalRevenue) *
                            100
                          ).toFixed(1)
                        : '0'}
                      %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products Preview */}
          <div className="chart-card">
            <h3 className="chart-title" style={{ padding: '20px 24px 0' }}>
              Top Products by Revenue
            </h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topProducts.map((p) => (
                    <tr key={p._id}>
                      <td className="table-cell-primary">{p.productName}</td>
                      <td>{formatCurrency(p.totalRevenue)}</td>
                      <td className="text-green">
                        {formatCurrency(p.totalProfit)}
                      </td>
                      <td>{p.totalQuantitySold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
