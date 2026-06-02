const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Manually load .env for local development only
const envPath = path.join(__dirname, '.env');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === 'http://localhost:5173') {
      callback(null, true);
    } else {
      callback(null, process.env.CORS_ORIGIN || origin);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Lazy DB connection on first request (non-blocking)
let dbConnectionPromise = null;
app.use((req, res, next) => {
  // Don't block the request - start DB connection in background
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch(err => {
      console.error('DB connection failed:', err.message);
      dbConnectionPromise = null; // Reset for retry
    });
  }
  next();
});

app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/admin',       require('./routes/adminRoutes'));
app.use('/api/matches',     require('./routes/matchRoutes'));
app.use('/api/chat',        require('./routes/chatRoutes'));
app.use('/api/community',   require('./routes/communityRoutes'));
app.use('/api/marketplace', require('./routes/marketplaceRoutes'));
app.use('/api/blind',       require('./routes/blindDateRoutes'));

app.get('/api/status', (req, res) => res.json({
  status:  '❤️  LoveConnect API running',
  routes: [
    'POST /api/auth/register',
    'POST /api/auth/login',
    'GET  /api/matches/users',
    'POST /api/matches/like/:id',
    'GET  /api/matches',
    'GET  /api/chat/:userId',
    'POST /api/chat/send',
    'GET  /api/community',
    'POST /api/community',
    'GET  /api/marketplace',
    'POST /api/marketplace/purchase/:id',
    'GET  /api/blind/match',
  ]
}));

// Lightweight ping endpoint for quick routing checks
app.get('/api/ping', (req, res) => res.type('text').send('pong'));

module.exports = { app, connectDB, corsOptions };
