// server/controllers/blindDateController.js
const User = require('../models/User');

// GET /api/blind/match  ← BlindDate.jsx find match button
exports.findMatch = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);

    // Find a random user that is not me and not already matched
    const excluded = [req.user._id, ...me.matches, ...me.likes];

    const candidates = await User.find({
      _id: { $nin: excluded }
    }).select('_id');

    if (candidates.length === 0)
      return res.status(404).json({ message: 'No matches available right now' });

    // Pick random candidate
    const random   = candidates[Math.floor(Math.random() * candidates.length)];
    const vibes    = [
      'Calm & Funny 😌',
      'Adventurous & Bold 🔥',
      'Romantic & Deep 💫',
      'Chill & Creative 🎨',
      'Sporty & Fun 🏃',
    ];
    const vibe          = vibes[Math.floor(Math.random() * vibes.length)];
    const compatibility = Math.floor(Math.random() * 20) + 80; // 80–99%

    res.json({
      id:            random._id,
      name:          'Anonymous Match',
      vibe,
      compatibility,
      isPremium:     me.isPremium,
      messageLimit:  me.isPremium ? 999 : 6,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/blind/upgrade  ← upgrade user to premium via bank or mobile money
exports.upgradeToPremium = async (req, res) => {
  try {
    const { method, provider, account, accountName } = req.body;
    const user = await User.findById(req.user._id);

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    user.isPremium = true;
    await user.save();

    res.json({
      message: 'Premium activated successfully',
      premium: true,
      payment: {
        method,
        provider,
        account,
        accountName,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/blind/status  ← return current premium status
exports.getPremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.json({ isPremium: user.isPremium });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};