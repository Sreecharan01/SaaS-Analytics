const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    priceAtSale: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    costAtSale: {
      type: Number,
      required: true,
      min: [0, 'Cost cannot be negative'],
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required'],
    index: true,
  },
  items: {
    type: [saleItemSchema],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'A sale must contain at least one item',
    },
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative'],
  },
  totalCost: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Total cost cannot be negative'],
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: {
      values: ['cash', 'card', 'upi'],
      message: 'Payment method must be cash, card, or upi',
    },
    lowercase: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

// CRITICAL COMPOUND INDEX: O(log N) date-filtered analytics per tenant
// This slashes lookup times from O(N) linear scans to O(log N) binary tree lookups
saleSchema.index({ businessId: 1, timestamp: -1 });

module.exports = mongoose.model('Sale', saleSchema);
