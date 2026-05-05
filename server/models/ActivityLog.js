// server/models/ActivityLog.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:     { type: String, required: true }, // 'login', 'message', 'payment', 'match', etc
  details:    { type: mongoose.Schema.Types.Mixed },
  ipAddress:  { type: String },
  createdAt:  { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
