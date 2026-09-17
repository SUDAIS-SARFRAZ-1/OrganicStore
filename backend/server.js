const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Security Startup Verification (Item 8)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
  console.error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing or shorter than 32 characters.');
  console.error('Refusing to start backend server until a secure JWT_SECRET is configured.');
  process.exit(1);
}

const authRoutes = require('./src/routes/authRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const couponRoutes = require('./src/routes/couponRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const { publicRouter: contentPublicRoutes, adminRouter: contentAdminRoutes } = require('./src/routes/contentRoutes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware: Helmet HTTP Headers (Item 14 & CSP/HSTS)
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP is handled at the frontend / reverse-proxy layer
    crossOriginEmbedderPolicy: false,
  })
);

// Allowed CORS origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://organicstore-1.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // In production, reject requests from browsers missing Origin header
      if (!origin) {
        if (process.env.NODE_ENV === 'production') {
          return callback(new Error('Origin header required in production'));
        }
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Webhook raw body parser for Stripe signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body and Cookie Parsers with Payload Size Limits (Item 14 & Signed Cookies Item 10)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Organic Store API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/home', contentPublicRoutes);
app.use('/api/admin/home', contentAdminRoutes);

// Error Handling Middlewares (Rule 21 & Item 14)
app.use(notFoundHandler);
app.use(errorHandler);

const { bootstrapAdmin } = require('./src/utils/bootstrapAdmin');

const server = app.listen(PORT, async () => {
  console.log(`Organic Store API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  try {
    await bootstrapAdmin();
  } catch (err) {
    console.error('Failed to bootstrap admin account:', err.message);
  }
});

module.exports = { app, server };

