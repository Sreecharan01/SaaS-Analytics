const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');
const Business = require('../models/Business');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// Validation rules
const registerValidation = [
  body('storeName')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ max: 100 })
    .withMessage('Store name cannot exceed 100 characters'),
  body('ownerEmail')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('ownerEmail')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * @desc    Register a new business tenant
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { storeName, ownerEmail, password } = req.body;

    // Check if business already exists
    const existingBusiness = await Business.findOne({ ownerEmail });
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        message: 'A business with this email already exists',
      });
    }

    // Create business (password is hashed via pre-save hook)
    const business = await Business.create({
      storeName,
      ownerEmail,
      passwordHash: password,
    });

    const token = generateToken(business._id);

    res.status(201).json({
      success: true,
      data: {
        _id: business._id,
        storeName: business.storeName,
        ownerEmail: business.ownerEmail,
        subscriptionStatus: business.subscriptionStatus,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login business owner
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { ownerEmail, password } = req.body;

    // Find business and include password for comparison
    const business = await Business.findOne({ ownerEmail }).select(
      '+passwordHash'
    );

    if (!business) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isMatch = await business.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(business._id);

    res.json({
      success: true,
      data: {
        _id: business._id,
        storeName: business.storeName,
        ownerEmail: business.ownerEmail,
        subscriptionStatus: business.subscriptionStatus,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current business profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.business,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  registerValidation,
  loginValidation,
};
