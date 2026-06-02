// server/config/db.js
const mongoose = require('mongoose');

let isConnecting = false;
let isConnected = false;

const connectDB = async () => {
  // If already connected or connecting, skip
  if (isConnected || isConnecting) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.warn('⚠️  No MongoDB URI provided. DB operations will fail.');
    return null;
  }

  if (isConnecting) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (isConnected) {
          clearInterval(checkInterval);
          resolve(mongoose.connection);
        }
      }, 100);
    });
  }

  isConnecting = true;

  try {
    console.log('🔍 Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, {
      connectTimeoutMS: 3000,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 5000,
      maxPoolSize: 3,
      minPoolSize: 0,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ DB Error: ${error.message}`);
    isConnecting = false;
    // Don't exit in serverless environment
  }
};

module.exports = connectDB;