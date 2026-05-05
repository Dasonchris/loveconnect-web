// server/controllers/userController.js
const User = require('../models/User');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');

// GET /api/users/dashboard/stats
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const messagesSent = await Message.countDocuments({ from: req.user._id });
    const messagesReceived = await Message.countDocuments({ to: req.user._id });
    const activityCount = await ActivityLog.countDocuments({ userId: req.user._id });

    res.json({
      user: {
        name: user.name,
        age: user.age,
        email: user.email,
        isPremium: user.isPremium,
        matches: user.matches.length,
        likes: user.likes.length,
        dislikes: user.dislikes.length,
      },
      stats: {
        messagesSent,
        messagesReceived,
        totalMatches: user.matches.length,
        activities: activityCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/dashboard/activity
exports.getUserActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const activities = await ActivityLog.find({ userId: req.user._id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ActivityLog.countDocuments({ userId: req.user._id });

    res.json({ activities, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/dashboard/messages
exports.getUserMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ $or: [{ from: req.user._id }, { to: req.user._id }] })
      .populate('from to', 'name email photo')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Message.countDocuments({ $or: [{ from: req.user._id }, { to: req.user._id }] });

    res.json({ messages, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
