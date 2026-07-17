const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Import route modules
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const billingRoutes = require('./routes/billingRoutes');
const { handleWebhook } = require('./controllers/webhookController');

// Initialize Express app
const app = express();

// ─── Security Middleware ─────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// ─── Stripe Webhook (MUST BE BEFORE express.json) ────────
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// ─── Body Parsing ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SaaS Analytics API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Centralized Error Handler ───────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api`);
      console.log(`❤️  Health:   http://localhost:${PORT}/api/health\n`);
    });
  };
  startServer();
} else {
  // In production (Vercel serverless), connect to DB globally
  connectDB();
}

module.exports = app;
