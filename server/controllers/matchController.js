const User = require("../models/User");
const Match = require("../models/Match");

// ── Get swipe users ────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("name age photo");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to get users" });
  }
};

// ── Like user (CORE LOGIC) ─────────────────────────
exports.likeUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.targetId;

    const user = await User.findById(userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add like
    if (!user.likes.includes(targetId)) {
      user.likes.push(targetId);
      await user.save();
    }

    // 🔥 Check mutual like
    const isMatch = target.likes.includes(userId);

    if (isMatch) {
      // Avoid duplicate match
      const existing = await Match.findOne({
        users: { $all: [userId, targetId] },
      });

      if (!existing) {
        await Match.create({
          users: [userId, targetId],
        });
      }

      return res.json({ match: true });
    }

    res.json({ match: false });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Like failed" });
  }
};

// ── Dislike user ───────────────────────────────────
exports.dislikeUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.targetId;

    await User.findByIdAndUpdate(userId, {
      $addToSet: { dislikes: targetId },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Dislike failed" });
  }
};

// ── Get matches ────────────────────────────────────
exports.getMatches = async (req, res) => {
  try {
    const userId = req.user.id;

    const matches = await Match.find({
      users: userId,
    }).populate("users", "name age photo");

    // return only the OTHER user
    const result = matches.map((match) => {
      return match.users.find(
        (u) => u._id.toString() !== userId
      );
    });

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch matches" });
  }
};