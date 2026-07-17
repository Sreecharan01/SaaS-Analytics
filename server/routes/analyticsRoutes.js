const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getKPISummary,
  getRevenueTrend,
  getTopProducts,
  getPaymentDistribution,
  getLowStockProducts,
} = require('../controllers/analyticsController');

// All analytics routes are protected
router.use(protect);

router.get('/kpi', getKPISummary);
router.get('/revenue-trend', getRevenueTrend);
router.get('/top-products', getTopProducts);
router.get('/payment-distribution', getPaymentDistribution);
router.get('/low-stock', getLowStockProducts);

module.exports = router;
