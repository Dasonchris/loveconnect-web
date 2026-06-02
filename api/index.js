const serverless = require('serverless-http');
const { app } = require('../server/app');
const connectDB = require('../server/config/db');

let connectionPromise = null;

// Lazy-connect to DB on first request, don't block the function
const ensureDbConnection = () => {
  if (!connectionPromise) {
    connectionPromise = connectDB().catch(err => {
      console.error('DB connection error:', err && err.message ? err.message : err);
      connectionPromise = null; // Reset so next request tries again
    });
  }
  // Don't wait for it - let it connect in background
  return Promise.resolve();
};

const handler = serverless(app);

module.exports = async (req, res) => {
  // Start DB connection in background (don't await)
  ensureDbConnection();
  return handler(req, res);
};
