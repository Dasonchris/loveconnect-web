const Match = require("../models/Match");
const User = require("../models/User");

// POST /api/users/:id/like
router.post("/:id/like", async (req, res) => {
  try {
    const userId = req.user.id;       // logged in user
    const targetId = req.params.id;   // user being liked

    const user = await User.findById(userId);
    const target = await User.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add like if not already
    if (!user.likes.includes(targetId)) {
      user.likes.push(targetId);
      await user.save();
    }

    // 🔥 CHECK FOR MUTUAL LIKE
    const isMatch = target.likes.includes(userId);

    if (isMatch) {
      // Prevent duplicate matches
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
    res.status(500).json({ message: "Server error" });
  }
});