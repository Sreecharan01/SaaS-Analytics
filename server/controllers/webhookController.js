const Stripe = require('stripe');
const Business = require('../models/Business');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @desc    Stripe Webhook Handler
 * @route   POST /api/billing/webhook
 * @access  Public (Called by Stripe)
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // This MUST be the raw body, handled in server.js
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.client_reference_id) {
          await Business.findByIdAndUpdate(session.client_reference_id, {
            subscriptionStatus: 'active',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
          });
          console.log(`[Stripe] Upgraded business ${session.client_reference_id} to active`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await Business.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          { subscriptionStatus: 'trial' }
        );
        console.log(`[Stripe] Downgraded subscription ${subscription.id} to trial`);
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).end();
  }
};
