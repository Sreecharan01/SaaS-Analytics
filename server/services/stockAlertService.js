const nodemailer = require('nodemailer');
const Product = require('../models/Product');
const Business = require('../models/Business');

// Simple in-memory rate limiter (tracks last alert time per product)
const alertHistory = new Map();
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Create reusable transporter.
 * Only creates transport if SMTP credentials are configured.
 */
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Check for low stock products and send alert email to business owner.
 * Rate-limited: max 1 alert per product per 24 hours.
 *
 * @param {string} businessId - The tenant's business ID
 */
const checkAndAlert = async (businessId) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(
        '📧 SMTP not configured — skipping stock alert email'
      );
      return;
    }

    // Find products below their threshold
    const lowStockProducts = await Product.find({
      businessId,
      $expr: { $lte: ['$stockLevel', '$lowStockThreshold'] },
    });

    if (lowStockProducts.length === 0) return;

    // Filter out recently alerted products
    const now = Date.now();
    const productsToAlert = lowStockProducts.filter((product) => {
      const key = `${businessId}_${product._id}`;
      const lastAlerted = alertHistory.get(key);
      if (lastAlerted && now - lastAlerted < ALERT_COOLDOWN_MS) {
        return false; // Still in cooldown
      }
      return true;
    });

    if (productsToAlert.length === 0) return;

    // Fetch business owner details
    const business = await Business.findById(businessId);
    if (!business) return;

    // Build HTML email
    const productRows = productsToAlert
      .map(
        (p) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.sku}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: ${p.stockLevel === 0 ? '#ef4444' : '#f59e0b'}; font-weight: bold;">
          ${p.stockLevel}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.lowStockThreshold}</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">⚠️ Low Stock Alert</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0;">For ${business.storeName}</p>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
          <p style="color: #475569; margin-bottom: 16px;">
            The following products have fallen below their minimum stock thresholds and require immediate attention:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 10px; text-align: left; color: #64748b; font-size: 13px;">PRODUCT</th>
                <th style="padding: 10px; text-align: left; color: #64748b; font-size: 13px;">SKU</th>
                <th style="padding: 10px; text-align: left; color: #64748b; font-size: 13px;">CURRENT STOCK</th>
                <th style="padding: 10px; text-align: left; color: #64748b; font-size: 13px;">THRESHOLD</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
            This is an automated alert from your SaaS Analytics Dashboard.
          </p>
        </div>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.ALERT_FROM_EMAIL || process.env.SMTP_USER,
      to: business.ownerEmail,
      subject: `⚠️ Low Stock Alert — ${productsToAlert.length} product(s) need restocking`,
      html: htmlContent,
    });

    // Update alert history
    productsToAlert.forEach((product) => {
      const key = `${businessId}_${product._id}`;
      alertHistory.set(key, now);
    });

    console.log(
      `📧 Low stock alert sent to ${business.ownerEmail} for ${productsToAlert.length} product(s)`
    );
  } catch (error) {
    console.error('❌ Stock alert service error:', error.message);
  }
};

module.exports = { checkAndAlert };
