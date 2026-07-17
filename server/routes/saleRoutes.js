const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSales,
  createSale,
  importCSV,
  upload,
} = require('../controllers/saleController');

// All sale routes are protected
router.use(protect);

router.route('/').get(getSales).post(createSale);
router.post('/import-csv', upload.single('file'), importCSV);

module.exports = router;
