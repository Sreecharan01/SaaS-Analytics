const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

/**
 * @desc    Get KPI summary (revenue, profit, avg ticket, low stock count)
 * @route   GET /api/analytics/kpi
 * @access  Private
 */
const getKPISummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const businessId = new mongoose.Types.ObjectId(req.businessId);

    // Build date match filter
    const dateMatch = { businessId };
    if (startDate || endDate) {
      dateMatch.timestamp = {};
      if (startDate) dateMatch.timestamp.$gte = new Date(startDate);
      if (endDate) dateMatch.timestamp.$lte = new Date(endDate);
    }

    // Aggregate revenue, cost, transaction count
    const [salesAgg] = await Sale.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalCost: { $sum: '$totalCost' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    // Count low stock products
    const lowStockCount = await Product.countDocuments({
      businessId: req.businessId,
      $expr: { $lte: ['$stockLevel', '$lowStockThreshold'] },
    });

    const totalRevenue = salesAgg?.totalRevenue || 0;
    const totalCost = salesAgg?.totalCost || 0;
    const transactionCount = salesAgg?.transactionCount || 0;

    res.json({
      success: true,
      data: {
        totalRevenue,
        grossProfit: totalRevenue - totalCost,
        avgTicketValue:
          transactionCount > 0 ? totalRevenue / transactionCount : 0,
        transactionCount,
        lowStockCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get revenue trend over time (daily/weekly/monthly)
 * @route   GET /api/analytics/revenue-trend
 * @access  Private
 */
const getRevenueTrend = async (req, res, next) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    const businessId = new mongoose.Types.ObjectId(req.businessId);

    const dateMatch = { businessId };
    if (startDate || endDate) {
      dateMatch.timestamp = {};
      if (startDate) dateMatch.timestamp.$gte = new Date(startDate);
      if (endDate) dateMatch.timestamp.$lte = new Date(endDate);
    } else {
      // Default: last 30 days
      dateMatch.timestamp = {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    }

    // Build date grouping based on period
    let dateGroup;
    switch (period) {
      case 'weekly':
        dateGroup = {
          year: { $isoWeekYear: '$timestamp' },
          week: { $isoWeek: '$timestamp' },
        };
        break;
      case 'monthly':
        dateGroup = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
        };
        break;
      case 'daily':
      default:
        dateGroup = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
        };
    }

    const trend = await Sale.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: dateGroup,
          revenue: { $sum: '$totalAmount' },
          cost: { $sum: '$totalCost' },
          profit: { $sum: { $subtract: ['$totalAmount', '$totalCost'] } },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    ]);

    // Format dates for chart consumption
    const formattedTrend = trend.map((item) => {
      let date;
      if (period === 'weekly') {
        // Approximate date from ISO week
        date = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
      } else if (period === 'monthly') {
        date = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      } else {
        date = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      }
      return {
        date,
        revenue: item.revenue,
        cost: item.cost,
        profit: item.profit,
        transactions: item.transactions,
      };
    });

    res.json({ success: true, data: formattedTrend });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top performing products by revenue
 * @route   GET /api/analytics/top-products
 * @access  Private
 */
const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 5, startDate, endDate } = req.query;
    const businessId = new mongoose.Types.ObjectId(req.businessId);

    const dateMatch = { businessId };
    if (startDate || endDate) {
      dateMatch.timestamp = {};
      if (startDate) dateMatch.timestamp.$gte = new Date(startDate);
      if (endDate) dateMatch.timestamp.$lte = new Date(endDate);
    }

    const topProducts = await Sale.aggregate([
      { $match: dateMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalRevenue: {
            $sum: { $multiply: ['$items.priceAtSale', '$items.quantity'] },
          },
          totalProfit: {
            $sum: {
              $multiply: [
                { $subtract: ['$items.priceAtSale', '$items.costAtSale'] },
                '$items.quantity',
              ],
            },
          },
          totalQuantitySold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 1,
          productName: 1,
          totalRevenue: 1,
          totalProfit: 1,
          totalQuantitySold: 1,
        },
      },
    ]);

    res.json({ success: true, data: topProducts });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment method distribution
 * @route   GET /api/analytics/payment-distribution
 * @access  Private
 */
const getPaymentDistribution = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const businessId = new mongoose.Types.ObjectId(req.businessId);

    const dateMatch = { businessId };
    if (startDate || endDate) {
      dateMatch.timestamp = {};
      if (startDate) dateMatch.timestamp.$gte = new Date(startDate);
      if (endDate) dateMatch.timestamp.$lte = new Date(endDate);
    }

    const distribution = await Sale.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Calculate percentages
    const totalTransactions = distribution.reduce(
      (sum, d) => sum + d.count,
      0
    );
    const formattedDistribution = distribution.map((d) => ({
      method: d._id,
      count: d.count,
      totalAmount: d.totalAmount,
      percentage:
        totalTransactions > 0
          ? ((d.count / totalTransactions) * 100).toFixed(1)
          : 0,
    }));

    res.json({ success: true, data: formattedDistribution });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get low stock products
 * @route   GET /api/analytics/low-stock
 * @access  Private
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const lowStockProducts = await Product.find({
      businessId: req.businessId,
      $expr: { $lte: ['$stockLevel', '$lowStockThreshold'] },
    }).sort({ stockLevel: 1 });

    res.json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKPISummary,
  getRevenueTrend,
  getTopProducts,
  getPaymentDistribution,
  getLowStockProducts,
};
