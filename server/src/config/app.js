const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const compression = require('compression');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const authRoutes = require('../routes/authRoutes');
const formRoutes = require('../routes/formRoutes');
const tokenRoutes = require('../routes/tokenRoutes');
const embedRoutes = require('../routes/embedRoutes');
const healthRoutes = require('../routes/healthRoutes');
const systemContentRoutes = require('../routes/systemContentRoutes');
const limiters = require('../middleware/rateLimit');
const requestLogger = require('../middleware/requestLogger');
const csrfProtection = require('../middleware/csrfProtection');
const logger = require('../utils/logger');
const { errorHandler } = require('../middleware/errorHandler');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.API_URL || 'http://localhost:3000']
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable compression
app.use(compression());

// Data sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Parse JSON requests
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Token', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Apply rate limiting
app.use('/api/auth', limiters.auth);
app.use('/api/forms/*/responses', limiters.formSubmission);
app.use('/api', limiters.default);

// Global rate limiter for all routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(globalLimiter);

// CSRF protection
app.use(csrfProtection());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/embed', embedRoutes);
app.use('/api/system', systemContentRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
