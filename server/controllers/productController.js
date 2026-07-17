const Product = require('../models/Product');
const multer = require('multer');
const { parseCSV } = require('../services/csvParser');
const { checkAndAlert } = require('../services/stockAlertService');

// Multer config for CSV uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * @desc    Get all products for the current business
 * @route   GET /api/products
 * @access  Private
 */
const getProducts = async (req, res, next) => {
  try {
    const { search, sortBy = 'name', order = 'asc' } = req.query;

    let query = { businessId: req.businessId };

    // Search by name or SKU
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const products = await Product.find(query).sort({ [sortBy]: sortOrder });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Private
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.body,
      businessId: req.businessId,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private
 */
const updateProduct = async (req, res, next) => {
  try {
    // Prevent changing businessId
    delete req.body.businessId;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check for low stock alerts after update
    if (product.stockLevel <= product.lowStockThreshold) {
      checkAndAlert(req.businessId).catch(console.error);
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk import products from CSV
 * @route   POST /api/products/import-csv
 * @access  Private
 */
const importCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file',
      });
    }

    const csvString = req.file.buffer.toString('utf-8');
    const requiredColumns = [
      'name',
      'sku',
      'stockLevel',
      'costPrice',
      'sellingPrice',
    ];

    const { validRows, errors } = parseCSV(csvString, requiredColumns, {
      stockLevel: 'number',
      costPrice: 'number',
      sellingPrice: 'number',
      lowStockThreshold: 'number',
    });

    if (validRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid rows found in CSV',
        errors,
      });
    }

    // Add businessId to each row
    const productsToInsert = validRows.map((row) => ({
      businessId: req.businessId,
      name: row.name,
      sku: row.sku,
      stockLevel: Number(row.stockLevel) || 0,
      lowStockThreshold: Number(row.lowStockThreshold) || 10,
      costPrice: Number(row.costPrice),
      sellingPrice: Number(row.sellingPrice),
    }));

    const inserted = await Product.insertMany(productsToInsert, {
      ordered: false,
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} products`,
      imported: inserted.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    // Handle partial insert failures (duplicate keys etc.)
    if (error.code === 11000 || error.writeErrors) {
      const insertedCount = error.insertedDocs?.length || 0;
      return res.status(207).json({
        success: true,
        message: `Partially imported. ${insertedCount} inserted, some duplicates skipped.`,
        imported: insertedCount,
        errors: error.writeErrors?.map((e) => e.errmsg) || [],
      });
    }
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  importCSV,
  upload,
};
