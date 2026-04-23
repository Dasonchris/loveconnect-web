// server/routes/blindDateRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { findMatch } = require('../controllers/blindDateController');

router.get('/match', auth, findMatch);

module.exports = router;