const express = require('express');
const { createCheckoutSession, createPortalSession, mockSuccess } = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/create-portal-session', protect, createPortalSession);
router.post('/mock-success', protect, mockSuccess);

module.exports = router;
