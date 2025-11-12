require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { requireAdmin } = require('./middleware/admin.middleware');

dotenv.config();
const { authenticate } = require('./middleware/auth.middleware');
const { addOrganizationContext, organizationContext } = require('./middleware/organization.middleware');

const app = express();

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false, 
});

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use('/api/', (req, res, next) => {
  if (process.env.NODE_ENV === 'development' || publicPaths.includes(req.path)) {
    return next();
  }
  return limiter(req, res, next);
});

const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password'
];

app.use((req, res, next) => {
  if (publicPaths.includes(req.path)) return next();
  return authenticate(req, res, next);
});

app.use(organizationContext);

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
app.use((req, res, next) => { req.asyncHandler = asyncHandler; next(); });

app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/users', require('./routes/user.route'));
app.use('/api/tasks', require('./routes/task.route'));
app.use('/api/teams', require('./routes/team.route'));
app.use('/api/notifications', require('./routes/notification.route'));
app.use('/api/activity-logs', require('./routes/activityLog.route'));
app.use('/api/admin', requireAdmin, require('./routes/admin.route'));
app.use('/api/dashboard', require('./routes/dashboard.route'));

app.use((err, req, res, next) => {
  console.error('Error:', err);

  let statusCode = 500;
  let message = 'Something went wrong!';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(error => error.message).join(', ');
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate key error';
  } else if (err instanceof TypeError || err instanceof ReferenceError) {
    message = 'Internal server error';
  } else {
    message = err.message || message;
    statusCode = err.statusCode || err.status || statusCode;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        type: err.name,
        stack: err.stack,
        details: err.errors || err
      }
    })
  });
});

const initializeRBAC = require('./scripts/initRBAC');
const { initializeSettings } = require('./scripts/initSettings');

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    addOrganizationContext();
    console.log('✅ Organization context initialized');

    await initializeRBAC();
    console.log('✅ RBAC system initialized');

    await initializeSettings();
    console.log('✅ System settings initialized');

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
