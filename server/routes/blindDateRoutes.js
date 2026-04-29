// server/routes/blindDateRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const {
  findMatch,
  upgradeToPremium,
  getPremiumStatus,
} = require('../controllers/blindDateController');

router.get('/match', auth, findMatch);
router.post('/upgrade', auth, upgradeToPremium);
router.get('/status', auth, getPremiumStatus);

module.exports = router;