// server/controllers/adminController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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
    const message = await Message.findById(messageId);

    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Soft-delete: mark as deleted so admin can restore
    message.deleted = true;
    await message.save();

    res.json({ message: 'Message soft-deleted', deleted: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Messages (supports search, fromUser filter, pagination, includeDeleted)
exports.getAllMessages = async (req, res) => {
  try {
    const { page = 1, limit = 30, fromUser = '', search = '', includeDeleted = 'false' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (fromUser) query.$or = [{ from: fromUser }, { sender: fromUser }];
    if (search) query.text = { $regex: new RegExp(search, 'i') };
    if (includeDeleted !== 'true') query.deleted = { $ne: true };

    const messages = await Message.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Normalize fields so client can rely on `from`/`to` names
    const mapped = await Promise.all(
      messages.map(async (m) => {
        const doc = m.toObject();
        const fromId = doc.from || doc.sender || null;
        const toId = doc.to || doc.receiver || null;

        // Populate user names/emails if possible
        const [fromUserDoc, toUserDoc] = await Promise.all([
          fromId ? User.findById(fromId).select('name email') : null,
          toId ? User.findById(toId).select('name email') : null,
        ]);

        return {
          _id: doc._id,
          text: doc.text,
          photos: doc.photos || [],
          read: doc.read || false,
          deleted: doc.deleted || false,
          isBlindDate: doc.isBlindDate || false,
          typing: doc.typing || false,
          createdAt: doc.createdAt,
          from: fromUserDoc ? { _id: fromUserDoc._id, name: fromUserDoc.name, email: fromUserDoc.email } : null,
          to: toUserDoc ? { _id: toUserDoc._id, name: toUserDoc.name, email: toUserDoc.email } : null,
        };
      })
    );

    const total = await Message.countDocuments(query);

    res.json({ messages: mapped, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark message as read
exports.markMessageRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.read = true;
    await message.save();

    res.json({ message: 'Message marked as read', updated: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Restore a soft-deleted message
exports.restoreMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.deleted = false;
    await message.save();

    res.json({ message: 'Message restored', restored: message });
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

// POST /api/admin/users/:userId/reset-password
// Admin can reset a user's password to a temporary one. If SMTP is configured,
// the temporary password will be emailed to the user. Otherwise the temp
// password will be returned in the response so the admin can communicate it.
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate a secure temporary password
    const tempPassword = crypto.randomBytes(8).toString('base64').replace(/\/+|\=/g, '').slice(0, 12);
    const hashed = await bcrypt.hash(tempPassword, 10);

    // Update only the password field to avoid validating incomplete user documents
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashed },
      { new: true, runValidators: false }
    );

    // Log admin action
    await ActivityLog.create({
      userId: req.admin._id,
      action: 'admin_reset_password',
      details: { targetUserId: user._id, targetEmail: user.email }
    });

    // Try to send email if SMTP configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_FROM || `no-reply@${req.hostname}`;

    if (smtpHost && smtpUser && smtpPass) {
      // Require nodemailer lazily so server can start even when deps aren't installed
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
      } catch (e) {
        console.warn('nodemailer not installed — email features disabled');
        return res.json({ message: 'Temporary password set but email unavailable (nodemailer missing)', emailed: false, tempPassword });
      }

      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true' || false,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const mail = {
          from: fromEmail,
          to: user.email,
          subject: 'Your temporary password',
          text: `An administrator has reset your password. Your temporary password is: ${tempPassword}\n\nPlease sign in and change your password immediately.`,
        };

        await transporter.sendMail(mail);

        return res.json({ message: 'Temporary password set and emailed to the user', emailed: true });
      } catch (mailErr) {
        // Fall through to return password in response if email fails
        console.error('Failed to send reset email:', mailErr.message);
        return res.json({ message: 'Temporary password set but email failed', emailed: false, tempPassword });
      }
    }

    // No SMTP: return temp password so admin can share it securely
    return res.json({ message: 'Temporary password set (no SMTP configured)', emailed: false, tempPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
