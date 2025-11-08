require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();
const { authenticate } = require('./middleware/auth.middleware'); 

const app = express();

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100
});

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use('/api/', limiter);

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

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
app.use((req, res, next) => { req.asyncHandler = asyncHandler; next(); });

app.use('/api/auth', require('./routes/auth.route'));
// app.use('/api/users', require('./routes/user.route'));
// app.use('/api/tasks', require('./routes/task.route'));
// app.use('/api/teams', require('./routes/team.route'));
// app.use('/api/notifications', require('./routes/notification.route'));
app.use('/api/activity-logs', require('./routes/activityLog.route'));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: err.message || 'Something went wrong!',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
