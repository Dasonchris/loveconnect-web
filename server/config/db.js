// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  console.log('🔍 Connecting to MongoDB...');
  console.log('URI:', uri ? uri.substring(0, 20) + '...' : 'UNDEFINED ❌');

  if (!uri) {
    console.error('❌ No MongoDB URI provided. Skipping DB connection.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Error: ${error.message}`);
    // Don't exit in serverless environment
    console.log('Continuing without DB connection...');
  }
};

module.exports = connectDB;