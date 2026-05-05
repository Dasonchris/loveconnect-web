// server/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables manually
const fs   = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const Admin = require('./models/Admin');

const createAdmin = async () => {
  try {
    console.log('🔄 Connecting to database...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loveconnect';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Database connected');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'chris' });
    
    if (existingAdmin) {
      console.log('✅ Admin account already exists (username: chris)');
      process.exit(0);
      return;
    }

    // Create new admin
    console.log('🔄 Creating admin account...');
    const hashedPassword = await bcrypt.hash('chris123', 10);
    const admin = new Admin({
      username: 'chris',
      password: hashedPassword,
      name: 'Chris Admin',
      isActive: true,
    });

    await admin.save();
    console.log('✅ Admin account created successfully');
    console.log('📝 Username: chris');
    console.log('📝 Password: chris123');
    console.log('⚠️  IMPORTANT: Change this password in production!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
