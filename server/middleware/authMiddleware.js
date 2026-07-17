const jwt = require('jsonwebtoken');
const Business = require('../models/Business');

/**
 * Authentication Middleware
 * Extracts JWT from Authorization header, verifies it,
 * and attaches the tenant's businessId to the request pipeline.
 * This is the core of multi-tenant data isolation.
 */
const protect = async (req, res, next) => {
  let token;

  // Extract Bearer token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided',
    });
  }

  try {
    // Verify token and extract payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the business (without password) and attach to request
    const business = await Business.findById(decoded.id);

    if (!business) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — business account not found',
      });
    }

    if (business.subscriptionStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended — please contact support',
      });
    }

    // CRITICAL: Attach businessId to request for scoped queries
    req.businessId = decoded.id;
    req.business = business;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — token expired',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

module.exports = { protect };
