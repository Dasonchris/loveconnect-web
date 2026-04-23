// server/models/SelfNote.js  ← for SelfChat.jsx
const mongoose = require('mongoose');

const selfNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  time: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SelfNote', selfNoteSchema);