// server/controllers/chatController.js
const Message  = require('../models/Message');
const SelfNote = require('../models/SelfNote');

// GET /api/chat/:userId  ← load messages in Chat.jsx
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      deleted: false,
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/chat/send  ← send message in Chat.jsx
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text, isBlindDate } = req.body;

    if (!text?.trim())
      return res.status(400).json({ message: 'Message cannot be empty' });

    // Enforce message limit for free users (5 messages)
    const user = req.user;
    if (!user.isPremium && isBlindDate) {
      const count = await Message.countDocuments({
        sender:      req.user._id,
        receiver:    receiverId,
        isBlindDate: true,
      });
      if (count >= 5)
        return res.status(403).json({
          message:  'Message limit reached',
          upgrade:  true,
          limit:    5,
        });
    }

    const message = await Message.create({
      sender:      req.user._id,
      receiver:    receiverId,
      text,
      isBlindDate: isBlindDate || false,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/chat/:id  ← delete button in Chat.jsx
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message)
      return res.status(404).json({ message: 'Message not found' });

    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    message.deleted = true;
    await message.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Self Notes (SelfChat.jsx) ────────────────────────

// GET /api/chat/notes
exports.getNotes = async (req, res) => {
  try {
    const notes = await SelfNote.find({ user: req.user._id })
      .sort({ createdAt: 1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/chat/notes
exports.addNote = async (req, res) => {
  try {
    const { text, time } = req.body;
    if (!text?.trim())
      return res.status(400).json({ message: 'Note cannot be empty' });

    const note = await SelfNote.create({ user: req.user._id, text, time });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/chat/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await SelfNote.findById(req.params.id);
    if (!note)
      return res.status(404).json({ message: 'Note not found' });
    if (note.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};