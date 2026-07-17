const Sale = require('../models/Sale');
const Product = require('../models/Product');
const multer = require('multer');
const { parseCSV } = require('../services/csvParser');
const { checkAndAlert } = require('../services/stockAlertService');

// Multer config for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for sales data
});

/**
 * @desc    Get all sales for the current business
 * @route   GET /api/sales
 * @access  Private
 */
const getSales = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      paymentMethod,
    } = req.query;

    let query = { businessId: req.businessId };

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Payment method filter
    if (paymentMethod) {
      query.paymentMethod = paymentMethod.toLowerCase();
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Sale.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: sales.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new sale / transaction
 * @route   POST /api/sales
 * @access  Private
 */
const createSale = async (req, res, next) => {
  try {
    const { items, paymentMethod, timestamp } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A sale must contain at least one item',
      });
    }

    // Fetch product details and build sale items
    const saleItems = [];
    let totalAmount = 0;
    let totalCost = 0;

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        businessId: req.businessId,
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.stockLevel < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stockLevel}, Requested: ${item.quantity}`,
        });
      }

      const lineTotal = product.sellingPrice * item.quantity;
      const lineCost = product.costPrice * item.quantity;

      saleItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        priceAtSale: product.sellingPrice,
        costAtSale: product.costPrice,
      });

      totalAmount += lineTotal;
      totalCost += lineCost;

      // Decrement stock
      product.stockLevel -= item.quantity;
      await product.save();
    }

    const sale = await Sale.create({
      businessId: req.businessId,
      items: saleItems,
      totalAmount,
      totalCost,
      paymentMethod,
      timestamp: timestamp || Date.now(),
    });

    // Trigger low-stock check asynchronously
    checkAndAlert(req.businessId).catch(console.error);

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk import sales from CSV
 * @route   POST /api/sales/import-csv
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
      'productName',
      'quantity',
      'priceAtSale',
      'costAtSale',
      'paymentMethod',
    ];

    const { validRows, errors } = parseCSV(csvString, requiredColumns, {
      quantity: 'number',
      priceAtSale: 'number',
      costAtSale: 'number',
    });

    if (validRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid rows found in CSV',
        errors,
      });
    }

    // Group rows into individual transactions
    // Each CSV row is treated as a single-item sale for simplicity
    const salesToInsert = validRows.map((row) => ({
      businessId: req.businessId,
      items: [
        {
          productId:
            row.productId || new (require('mongoose').Types.ObjectId)(),
          productName: row.productName,
          quantity: Number(row.quantity),
          priceAtSale: Number(row.priceAtSale),
          costAtSale: Number(row.costAtSale) || 0,
        },
      ],
      totalAmount: Number(row.priceAtSale) * Number(row.quantity),
      totalCost: (Number(row.costAtSale) || 0) * Number(row.quantity),
      paymentMethod: (row.paymentMethod || 'cash').toLowerCase(),
      timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
    }));

    const inserted = await Sale.insertMany(salesToInsert, { ordered: false });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} sales`,
      imported: inserted.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSales,
  createSale,
  importCSV,
  upload,
};
