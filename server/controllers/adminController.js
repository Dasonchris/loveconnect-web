// server/controllers/adminController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Admin account disabled' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '24h',
    });

    res.json({ message: 'Admin login successful', token, admin: admin.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const totalMessages = await Message.countDocuments();
    const totalMatches = await User.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$matches' } } } },
    ]);
    const pendingVerifications = await User.countDocuments({ verified: false });

    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email');

    res.json({
      totalUsers,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
      totalMessages,
      totalMatches: totalMatches[0]?.total || 0,
      pendingVerifications,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {};

    const users = await User.find(query)
      .select('name email age isPremium isOnline createdAt verified dateOfBirth occupation')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ verified: 1, createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get User Details
exports.getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('matches likes dislikes');
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const messages = await Message.find({ from: userId }).limit(20).sort({ createdAt: -1 });
    const activity = await ActivityLog.find({ userId }).limit(50).sort({ createdAt: -1 });

    res.json({ user, messages, activity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ban/Delete User
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Log activity
    await ActivityLog.create({
      userId: req.admin._id,
      action: 'user_banned',
      details: { bannedUserId: userId, userName: user.name },
    });

    res.json({ message: 'User deleted successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify User
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verified = true;
    await user.save();

    await ActivityLog.create({
      userId: req.admin._id,
      action: 'user_verified',
      details: { verifiedUserId: userId, verifiedUserName: user.name },
    });

    res.json({ message: 'User verified successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndDelete(messageId);
    
    if (!message) return res.status(404).json({ message: 'Message not found' });

    res.json({ message: 'Message deleted', deleted: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Messages
exports.getAllMessages = async (req, res) => {
  try {
    const { page = 1, limit = 30, fromUser = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = fromUser ? { from: fromUser } : {};
    const messages = await Message.find(query)
      .populate('from to', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Message.countDocuments(query);

    res.json({ messages, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Payment Records
exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await ActivityLog.find({ action: 'payment' })
      .populate('userId', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ActivityLog.countDocuments({ action: 'payment' });

    res.json({ payments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Activity Logs
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .populate('userId', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ActivityLog.countDocuments();

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
