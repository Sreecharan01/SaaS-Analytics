const Stripe = require('stripe');
const Business = require('../models/Business');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Mock checkout URL for testing without real keys
const MOCK_STRIPE_KEY = 'sk_test_mock_secret_key';

/**
 * @desc    Create a Stripe Checkout Session for subscription
 * @route   POST /api/billing/create-checkout-session
 * @access  Private
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    if (business.subscriptionStatus === 'active') {
      return res.status(400).json({ success: false, message: 'You already have an active subscription' });
    }

    // Mock flow if no real stripe key provided
    if (process.env.STRIPE_SECRET_KEY === MOCK_STRIPE_KEY) {
      return res.json({
        success: true,
        url: `http://localhost:5173/billing?mock_success=true&session_id=mock_session_${Date.now()}`
      });
    }

    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/billing?canceled=true`,
      client_reference_id: businessId,
      customer_email: business.ownerEmail,
    };

    // If we already have a customer ID, use it
    if (business.stripeCustomerId) {
      sessionConfig.customer = business.stripeCustomerId;
      delete sessionConfig.customer_email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ success: true, url: session.url });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a Stripe Customer Portal Session
 * @route   POST /api/billing/create-portal-session
 * @access  Private
 */
exports.createPortalSession = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const business = await Business.findById(businessId);

    if (!business || !business.stripeCustomerId) {
      return res.status(400).json({ success: false, message: 'No active Stripe customer found' });
    }

    // Mock flow
    if (process.env.STRIPE_SECRET_KEY === MOCK_STRIPE_KEY) {
      return res.json({
        success: true,
        url: `http://localhost:5173/billing?mock_portal=true`
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: business.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/billing`,
    });

    res.json({ success: true, url: portalSession.url });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mock endpoint to simulate webhook success for testing without Stripe
 * @route   POST /api/billing/mock-success
 * @access  Private
 */
exports.mockSuccess = async (req, res, next) => {
  try {
    if (process.env.STRIPE_SECRET_KEY !== MOCK_STRIPE_KEY) {
      return res.status(403).json({ success: false, message: 'Mock endpoints disabled with real keys' });
    }

    const business = await Business.findById(req.businessId);
    business.subscriptionStatus = 'active';
    business.stripeCustomerId = 'cus_mock123';
    business.stripeSubscriptionId = 'sub_mock123';
    await business.save();

    res.json({ success: true, message: 'Subscription activated (Mock)' });
  } catch (error) {
    next(error);
  }
};
