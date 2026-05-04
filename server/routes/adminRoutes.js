// server/routes/adminRoutes.js
const router = require('express').Router();
const adminAuth = require('../middleware/adminMiddleware');
const {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getUserDetail,
  banUser,
  verifyUser,
  deleteMessage,
  getAllMessages,
  getPayments,
  getActivityLogs,
} = require('../controllers/adminController');

// Public - Admin Login
router.post('/login', adminLogin);

// Protected - All routes below require admin auth
router.get('/stats', adminAuth, getDashboardStats);
router.get('/users', adminAuth, getAllUsers);
router.get('/users/:userId', adminAuth, getUserDetail);
router.post('/users/:userId/verify', adminAuth, verifyUser);
router.delete('/users/:userId', adminAuth, banUser);
router.get('/messages', adminAuth, getAllMessages);
router.delete('/messages/:messageId', adminAuth, deleteMessage);
router.get('/payments', adminAuth, getPayments);
router.get('/activity-logs', adminAuth, getActivityLogs);

module.exports = router;
