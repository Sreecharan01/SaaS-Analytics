const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  importCSV,
  upload,
} = require('../controllers/productController');

// All product routes are protected
router.use(protect);

router.route('/').get(getProducts).post(createProduct);
router.post('/import-csv', upload.single('file'), importCSV);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);

module.exports = router;
